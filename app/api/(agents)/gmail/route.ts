import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import {
  GmailGetMessage,
  GmailSearch,
  GmailCreateDraft,
  GmailGetThread,
  GmailSendMessage,
} from '@langchain/community/tools/gmail';

// Simplified email interface matching the expected schema
interface EmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
}

// Replace the LangChain tool calls with direct Google API calls
// For creating drafts:
async function createDraft(accessToken: string, emailData: EmailParams) {
  const url = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts';
  
  // Convert the email data to the format expected by Gmail API
  const message = {
    raw: Buffer.from(
      `To: ${emailData.to}\r\n` +
      `Subject: ${emailData.subject}\r\n` +
      (emailData.cc ? `Cc: ${emailData.cc}\r\n` : '') +
      (emailData.bcc ? `Bcc: ${emailData.bcc}\r\n` : '') +
      '\r\n' +
      emailData.body
    ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  };
  
  // Call the Gmail API directly
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status} ${response.statusText}`);
  }
  
  return await response.json();
}

export async function POST(request: Request) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get input from request
    const { input } = await request.json();
    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    console.log("Processing Gmail request:", input);
    
    // Initialize NVIDIA LLM for understanding natural language
    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model: "meta/llama-3.3-70b-instruct",
      temperature: 0.2,
    });

    // First - determine intent with a simple prompt
    const intentResponse = await model.call(
      `You are a helpful assistant that categorizes user requests about Gmail.
      Based on the following request, tell me if the user wants to:
      1. SEARCH emails
      2. READ a specific email 
      3. CREATE a draft email
      4. SEND an email
      5. VIEW email thread
      6. Something else (explain what)
      
      Only respond with the category number and a one-word explanation.
      Example: "1:SEARCH" or "3:CREATE" or "4:SEND"
      
      User request: "${input}"`
    );
    
    console.log("Intent detection:", intentResponse);
    
    // Setup Gmail credentials
    const credentials = {
      accessToken: session.accessToken,
    };

    // Create Gmail tools
    const searchTool = new GmailSearch({ credentials });
    const getMessageTool = new GmailGetMessage({ credentials });
    const createDraftTool = new GmailCreateDraft({ credentials });
    const getThreadTool = new GmailGetThread({ credentials });
    const sendMessageTool = new GmailSendMessage({ credentials });
    
    // Process based on intent
    if (intentResponse.includes("1:SEARCH") || intentResponse.toLowerCase().includes("search")) {
      // Extract search parameters
      const searchParamsResponse = await model.call(
        `You are a helpful assistant that extracts Gmail search parameters.
        Extract the following details from the user's request and return ONLY a JSON object:
        {
          "query": "search query to use (e.g., 'from:john@example.com', 'subject:meeting', etc.)",
          "maxResults": 10
        }
        
        User request: "${input}"`
      );
      
      try {
        const searchParams = JSON.parse(
          searchParamsResponse.replace(/```json|```/g, '').trim()
        );
        
        console.log("Searching emails with params:", searchParams);
        const result = await searchTool.call(searchParams);
        
        // Format the results nicely
        const formattingResponse = await model.call(
          `You are a helpful Gmail assistant. The user asked to search their emails with the query: "${searchParams.query}".
          
          Here are the raw search results:
          ${result}
          
          Please format this information in a clean, user-friendly way. Include sender, subject, date, and mention the message ID so the user can read specific emails later if needed.
          If no emails were found, let the user know their search returned no results.`
        );
        
        return NextResponse.json({
          result: formattingResponse,
          steps: [{
            tool: "gmail_search",
            input: searchParams,
            output: result
          }]
        });
      } catch (error) {
        console.error("Error searching emails:", error);
        return NextResponse.json({
          result: "I had trouble searching your emails. Please try again with a simpler search query.",
          error: String(error)
        });
      }
    } else if (intentResponse.includes("2:READ") || intentResponse.toLowerCase().includes("read")) {
      // Extract message ID - might need two steps
      const messageIDResponse = await model.call(
        `You are a helpful assistant that helps users read emails.
        
        First, determine if the user already has a message ID to read. If they do, extract it.
        If they don't have a message ID but are referring to an email by other means (like subject or sender),
        suggest that they need to search for the email first to get its ID.
        
        Return ONLY a JSON object:
        {
          "hasMessageId": true or false,
          "messageId": "the message ID if available",
          "searchNeeded": true or false,
          "searchQuery": "suggested search query if search is needed"
        }
        
        User request: "${input}"`
      );
      
      try {
        const messageIDInfo = JSON.parse(
          messageIDResponse.replace(/```json|```/g, '').trim()
        );
        
        if (messageIDInfo.hasMessageId && messageIDInfo.messageId) {
          console.log("Reading email with ID:", messageIDInfo.messageId);
          const result = await getMessageTool.call({ messageId: messageIDInfo.messageId });
          
          // Format the email content nicely
          const formattingResponse = await model.call(
            `You are a helpful Gmail assistant. The user asked to read an email with ID: "${messageIDInfo.messageId}".
            
            Here is the raw email content:
            ${result}
            
            Please format this email in a clean, user-friendly way. Include the sender, recipients, subject, date, and the full message body.`
          );
          
          return NextResponse.json({
            result: formattingResponse,
            steps: [{
              tool: "gmail_get_message",
              input: { messageId: messageIDInfo.messageId },
              output: result
            }]
          });
        } else if (messageIDInfo.searchNeeded) {
          // Need to search first
          console.log("Search needed first with query:", messageIDInfo.searchQuery);
          const searchResult = await searchTool.call({ 
            query: messageIDInfo.searchQuery,
            maxResults: 5
          });
          
          const guidanceResponse = await model.call(
            `You are a helpful Gmail assistant. The user wanted to read an email but didn't provide a specific message ID.
            
            I searched for "${messageIDInfo.searchQuery}" and found these results:
            ${searchResult}
            
            Please create a helpful response that:
            1. Explains that to read a specific email, we need its ID
            2. Shows the search results I found
            3. Guides the user to either use one of these message IDs or refine their search`
          );
          
          return NextResponse.json({
            result: guidanceResponse,
            steps: [{
              tool: "gmail_search",
              input: { query: messageIDInfo.searchQuery },
              output: searchResult
            }]
          });
        } else {
          return NextResponse.json({
            result: "To read a specific email, I need either the message ID or details to help me search for it, like the sender's name or the subject line.",
            steps: []
          });
        }
      } catch (error) {
        console.error("Error reading email:", error);
        return NextResponse.json({
          result: "I had trouble accessing the email. Please make sure you've provided a valid message ID or try searching for emails first.",
          error: String(error)
        });
      }
    } else if (intentResponse.includes("3:CREATE") || intentResponse.toLowerCase().includes("draft")) {
      // Extract email draft details
      const draftDetailsResponse = await model.call(
        `You are a helpful assistant that extracts email draft details from user requests.
        Extract the following details from the user's request and return ONLY a JSON object:
        {
          "to": "recipient email address (can be comma-separated for multiple)",
          "subject": "email subject line",
          "body": "email body content",
          "cc": "optional cc recipients",
          "bcc": "optional bcc recipients"
        }
        
        User request: "${input}"`
      );
      
      try {
        const draftDetails = JSON.parse(
          draftDetailsResponse.replace(/```json|```/g, '').trim()
        );
        
        // Prepare the draft email with correct schema
        const draftParams = {
          message: {
            to: draftDetails.to,
            subject: draftDetails.subject || "No subject",
            body: draftDetails.body || "Draft email body",
            cc: undefined,
            bcc: undefined
          }
        };
        
        if (draftDetails.cc) draftParams.message.cc = draftDetails.cc;
        if (draftDetails.bcc) draftParams.message.bcc = draftDetails.bcc;
        
        // Validate email format
        if (!draftDetails.to.includes('@')) {
          // Add default domain if missing
          draftParams.message.to = `${draftDetails.to}@gmail.com`;
        }
        
        console.log("Creating draft email with correct schema:", draftParams);
        const result = await createDraft(session.accessToken, draftParams.message);
        
        // Format a nice response
        const formattingResponse = await model.call(
          `You are a helpful Gmail assistant. The user asked to create a draft email with these details:
          - To: ${draftDetails.to}
          - Subject: ${draftDetails.subject}
          - Body: ${draftDetails.body?.substring(0, 100)}${draftDetails.body?.length > 100 ? '...' : ''}
          
          The draft was successfully created. Here's the response from Gmail: ${result}
          
          Please provide a friendly confirmation message that the draft has been saved. Mention that they can find it in their Drafts folder.`
        );
        
        return NextResponse.json({
          result: formattingResponse,
          steps: [{
            tool: "gmail_create_draft",
            input: draftParams,
            output: result
          }]
        });
      } catch (error) {
        console.error("Error creating draft:", error);
        return NextResponse.json({
          result: "I had trouble creating your draft email. Please make sure you've provided valid recipient details and try again.",
          error: String(error)
        });
      }
    } else if (intentResponse.includes("4:SEND") || intentResponse.toLowerCase().includes("send")) {
      // Similar to draft but with extra confirmation
      const sendDetailsResponse = await model.call(
        `You are a helpful assistant that extracts email sending details from user requests.
        Extract the following details from the user's request and return ONLY a JSON object:
        {
          "to": "recipient email address (can be comma-separated for multiple)",
          "subject": "email subject line",
          "body": "email body content",
          "cc": "optional cc recipients",
          "bcc": "optional bcc recipients"
        }
        
        User request: "${input}"`
      );
      
      try {
        const sendDetails = JSON.parse(
          sendDetailsResponse.replace(/```json|```/g, '').trim()
        );
        
        // Double-check with user before sending
        const confirmationResponse = await model.call(
          `You are a helpful Gmail assistant. The user wants to send an email with these details:
          - To: ${sendDetails.to}
          - Subject: ${sendDetails.subject}
          - Body: ${sendDetails.body?.substring(0, 100)}${sendDetails.body?.length > 100 ? '...' : ''}
          
          For safety reasons, I'll create this as a draft first instead of sending it directly.
          This way, the user can review it before sending.
          
          Please write a message explaining that you're creating a draft and not sending immediately.`
        );
        
        // Create a draft with correct schema
        const draftParams = {
          message: {
            to: sendDetails.to,
            subject: sendDetails.subject || "No subject",
            body: sendDetails.body || "Email body",
            cc: undefined,
            bcc: undefined
          }
        };
        
        if (sendDetails.cc) draftParams.message.cc = sendDetails.cc;
        if (sendDetails.bcc) draftParams.message.bcc = sendDetails.bcc;
        
        // Validate email format
        if (!sendDetails.to.includes('@')) {
          // Add default domain if missing
          draftParams.message.to = `${sendDetails.to}@gmail.com`;
        }
        
        console.log("Creating draft email instead of sending with correct schema:", draftParams);
        const result = await createDraft(session.accessToken, draftParams.message);
        
        return NextResponse.json({
          result: confirmationResponse,
          steps: [{
            tool: "gmail_create_draft",
            input: draftParams,
            output: result
          }]
        });
      } catch (error) {
        console.error("Error handling send request:", error);
        return NextResponse.json({
          result: "I had trouble processing your email send request. Please try again with complete details including recipient, subject, and message body.",
          error: String(error)
        });
      }
    } else if (intentResponse.includes("5:VIEW") || intentResponse.toLowerCase().includes("thread")) {
      // Handle thread viewing - similar to message reading but with thread ID
      const threadIDResponse = await model.call(
        `You are a helpful assistant that helps users view email threads.
        
        First, determine if the user already has a thread ID to view. If they do, extract it.
        If they don't have a thread ID but are referring to an email thread by other means (like subject or sender),
        suggest that they need to search for emails first to get a thread ID.
        
        Return ONLY a JSON object:
        {
          "hasThreadId": true or false,
          "threadId": "the thread ID if available",
          "searchNeeded": true or false,
          "searchQuery": "suggested search query if search is needed"
        }
        
        User request: "${input}"`
      );
      
      try {
        const threadIDInfo = JSON.parse(
          threadIDResponse.replace(/```json|```/g, '').trim()
        );
        
        if (threadIDInfo.hasThreadId && threadIDInfo.threadId) {
          console.log("Viewing thread with ID:", threadIDInfo.threadId);
          const result = await getThreadTool.call({ threadId: threadIDInfo.threadId });
          
          // Format the thread content nicely
          const formattingResponse = await model.call(
            `You are a helpful Gmail assistant. The user asked to view an email thread with ID: "${threadIDInfo.threadId}".
            
            Here is the raw thread content:
            ${result}
            
            Please format this email thread in a clean, user-friendly way. Show each message in the thread chronologically, with sender, timestamp, and content.`
          );
          
          return NextResponse.json({
            result: formattingResponse,
            steps: [{
              tool: "gmail_get_thread",
              input: { threadId: threadIDInfo.threadId },
              output: result
            }]
          });
        } else if (threadIDInfo.searchNeeded) {
          // Need to search first
          console.log("Search needed first with query:", threadIDInfo.searchQuery);
          const searchResult = await searchTool.call({ 
            query: threadIDInfo.searchQuery,
            maxResults: 5
          });
          
          const guidanceResponse = await model.call(
            `You are a helpful Gmail assistant. The user wanted to view an email thread but didn't provide a specific thread ID.
            
            I searched for "${threadIDInfo.searchQuery}" and found these results:
            ${searchResult}
            
            Please create a helpful response that:
            1. Explains that to view a specific thread, we need its ID
            2. Shows the search results I found
            3. Guides the user to use one of these thread IDs or refine their search`
          );
          
          return NextResponse.json({
            result: guidanceResponse,
            steps: [{
              tool: "gmail_search",
              input: { query: threadIDInfo.searchQuery },
              output: searchResult
            }]
          });
        } else {
          return NextResponse.json({
            result: "To view a specific email thread, I need either the thread ID or details to help me search for relevant emails, like the conversation topic or participant names.",
            steps: []
          });
        }
      } catch (error) {
        console.error("Error viewing thread:", error);
        return NextResponse.json({
          result: "I had trouble accessing the email thread. Please make sure you've provided a valid thread ID or try searching for emails first.",
          error: String(error)
        });
      }
    } else {
      // Handle other intents
      return NextResponse.json({
        result: "I'm not sure what Gmail operation you want to perform. Try asking to search emails, read a specific email, create a draft, or view an email thread.",
        steps: []
      });
    }
  } catch (error: any) {
    console.error("Gmail API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
