import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import { google } from "googleapis";

export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get input from request body
    const { input } = await request.json();
    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    console.log("Processing People request:", input);

    // Initialize the LLM for natural language understanding
    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model: "meta/llama-3.3-70b-instruct",
      temperature: 0.2,
    });

    // Determine the intent of the request
    const intentResponse = await model.call(
      `You are a helpful assistant that categorizes user requests about Google Contacts.
Based on the following request, tell me if the user wants to:
1. LIST all contacts
2. SEARCH contacts
3. CREATE a new contact
4. Something else (explain what)

Only respond with the category number and a one-word explanation.
Example: "1:LIST", "2:SEARCH", or "3:CREATE"

User request: "${input}"`
    );

    console.log("Intent detection:", intentResponse);

    // Initialize People API client with OAuth2 authentication using the access token from the session
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: session.accessToken });
    const peopleApi = google.people({ version: "v1", auth: oauth2Client });

    // Process based on the detected intent
    if (intentResponse.includes("1:LIST") || intentResponse.toLowerCase().includes("list")) {
      // LIST contacts: Fetch connections from 'people/me'
      const response = await peopleApi.people.connections.list({
        resourceName: "people/me",
        pageSize: 50,
        personFields: "names,emailAddresses,phoneNumbers,photos",
      });
      const contacts = response.data.connections || [];

      // Optionally format contacts using the LLM
      const formattingResponse = await model.call(
        `You are a helpful assistant for Google Contacts. Format the following contact list in a clean, user-friendly summary. Only include each contact's name, email, and phone number (if available):
${JSON.stringify(contacts)}`
      );

      return NextResponse.json({
        result: formattingResponse,
        steps: [{
          tool: "people_list",
          input: {},
          output: contacts,
        }],
      });
    } else if (intentResponse.includes("2:SEARCH") || intentResponse.toLowerCase().includes("search")) {
      // SEARCH contacts: extract a search query via the LLM first
      const searchQueryResponse = await model.call(
        `Extract the search query for contacts from the following user request.
Return only the search query as plain text.
User request: "${input}"`
      );
      const searchQuery = searchQueryResponse.trim();
      console.log("Searching contacts with query:", searchQuery);

      // Call People API's searchContacts method
      const response = await peopleApi.people.searchContacts({
        query: searchQuery,
        readMask: "names,emailAddresses,phoneNumbers,photos",
      });
      const results = response.data.results || [];

      // If no results are found, return a simple friendly message
      if (results.length === 0) {
         return NextResponse.json({
           result: `No contacts found matching "${searchQuery}".`,
           steps: [{
             tool: "people_search",
             input: { query: searchQuery },
             output: results,
           }],
         });
      }

      const formattingResponse = await model.call(
        `You are a helpful assistant for Google Contacts. Format the following search results in a clean, user-friendly summary. Only include each contact's name, email, and phone number (if available):
${JSON.stringify(results)}`
      );

      return NextResponse.json({
        result: formattingResponse,
        steps: [{
          tool: "people_search",
          input: { query: searchQuery },
          output: results,
        }],
      });
    } else if (intentResponse.includes("3:CREATE") || intentResponse.toLowerCase().includes("create")) {
      // CREATE contact: extract new contact details via the LLM
      const contactDetailsResponse = await model.call(
        `You are a helpful assistant that extracts new contact details from a user's request.
Extract the following details and return ONLY a JSON object:
{
  "firstName": "First name",
  "lastName": "Last name",
  "email": "Email address",
  "phone": "Phone number"
}
If any field is missing, return it as an empty string.

User request: "${input}"`
      );

      const contactDetails = JSON.parse(
        contactDetailsResponse.replace(/```json|```/g, "").trim()
      );

      console.log("Creating contact with details:", contactDetails);

      // Build the new contact object as required by People API
      const newContact = {
        names: [{
          givenName: contactDetails.firstName,
          familyName: contactDetails.lastName,
        }],
        emailAddresses: contactDetails.email ? [{
          value: contactDetails.email,
        }] : [],
        phoneNumbers: contactDetails.phone ? [{
          value: contactDetails.phone,
          type: "mobile",
        }] : [],
      };

      const response = await peopleApi.people.createContact({
        requestBody: newContact,
      });

      const confirmationResponse = await model.call(
        `You are a helpful assistant for Google Contacts. The user requested to create a new contact with the following details:
First Name: ${contactDetails.firstName}
Last Name: ${contactDetails.lastName}
Email: ${contactDetails.email}
Phone: ${contactDetails.phone}
Confirm that the new contact has been created successfully.`
      );

      return NextResponse.json({
        result: confirmationResponse,
        steps: [{
          tool: "people_create",
          input: newContact,
          output: response.data,
        }],
      });
    } else {
      return NextResponse.json({
        result: "I'm not sure what contact operation you want to perform. Please try asking to list, search, or create a contact.",
        steps: [],
      });
    }
  } catch (error: Error | unknown) {
    console.error("People API Error:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
} 