import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool
} from "@langchain/community/tools/google_calendar";

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

    console.log("Processing calendar request:", input);
    
    // Initialize NVIDIA LLM for understanding natural language
    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model: "meta/llama-3.3-70b-instruct",
      temperature: 0.2,
    });

    // First - determine intent with a simple prompt
    const intentResponse = await model.call(
      `You are a helpful assistant that categorizes user requests about calendars.
      Based on the following request, tell me if the user wants to:
      1. CREATE a new calendar event
      2. VIEW existing calendar events
      3. Something else (explain what)
      
      Only respond with the category number and a one-word explanation.
      Example: "1:CREATE" or "2:VIEW" or "3:DELETE"
      
      User request: "${input}"`
    );
    
    console.log("Intent detection:", intentResponse);
    
    // Setup calendar tools
    const googleCalendarParams = {
      credentials: {
        accessToken: session.accessToken,
        calendarId: "primary",
      },
      scopes: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      model,
    };

    // Create calendar tools
    const viewTool = new GoogleCalendarViewTool(googleCalendarParams);
    const createTool = new GoogleCalendarCreateTool(googleCalendarParams);
    
    // Process based on intent
    if (intentResponse.includes("1:CREATE") || intentResponse.toLowerCase().includes("create")) {
      // Extract event details with LLM
      const eventDetailsResponse = await model.call(
        `You are a helpful assistant that extracts calendar event details from user requests.
        Extract the following details from the user's request and return ONLY a JSON object:
        {
          "summary": "Event title/description",
          "startTime": "Time when event starts (e.g., 3:00 PM)",
          "duration": "Duration in minutes (default 30 if not specified)",
          "date": "Date of event (default today if not specified)"
        }
        
        User request: "${input}"`
      );
      
      console.log("Extracted event details:", eventDetailsResponse);
      
      try {
        // Parse the LLM response to get event details
        const eventDetails = JSON.parse(
          eventDetailsResponse.replace(/```json|```/g, '').trim()
        );
        
        // Process time and date
        const now = new Date();
        const eventDate = eventDetails.date && eventDetails.date.toLowerCase() !== "today"
          ? new Date(eventDetails.date)
          : now;
        
        // Parse time (e.g., "3:00 PM")
        let [hourStr, minuteStr] = (eventDetails.startTime || "").split(":");
        let hour = parseInt(hourStr || "0");
        let isPM = false;
        
        if (minuteStr && minuteStr.toLowerCase().includes("pm")) {
          isPM = true;
          minuteStr = minuteStr.toLowerCase().replace("pm", "").trim();
        } else if (minuteStr && minuteStr.toLowerCase().includes("am")) {
          minuteStr = minuteStr.toLowerCase().replace("am", "").trim();
        }
        
        let minute = parseInt(minuteStr || "0");
        
        // Adjust for PM
        if (isPM && hour < 12) hour += 12;
        
        // Set event times
        const startDate = new Date(eventDate);
        startDate.setHours(hour, minute, 0, 0);
        
        const duration = parseInt(eventDetails.duration || "30");
        const endDate = new Date(startDate);
        endDate.setMinutes(endDate.getMinutes() + duration);
        
        // Create event in Google Calendar
        const eventData = {
          summary: eventDetails.summary || "New Event",
          start: { dateTime: startDate.toISOString() },
          end: { dateTime: endDate.toISOString() }
        };
        
        console.log("Creating calendar event:", eventData);
        const result = await createTool.call(JSON.stringify(eventData));
        
        // Generate user-friendly response with LLM
        const finalResponse = await model.call(
          `You are a helpful calendar assistant. The user requested to create an event with these details:
          - Title: ${eventDetails.summary}
          - Time: ${eventDetails.startTime} on ${eventDetails.date || "today"}
          - Duration: ${duration} minutes
          
          The event was successfully created. Please provide a friendly confirmation message.`
        );
        
        return NextResponse.json({
          result: finalResponse,
          steps: [{
            tool: "google_calendar_create",
            input: JSON.stringify(eventData),
            output: result
          }]
        });
      } catch (error) {
        console.error("Error creating event:", error);
        return NextResponse.json({
          result: "I had trouble creating your calendar event. Please try again with more specific details.",
          error: String(error)
        });
      }
    } else if (intentResponse.includes("2:VIEW") || intentResponse.toLowerCase().includes("view")) {
      // Extract view parameters
      const viewDetailsResponse = await model.call(
        `You are a helpful assistant that extracts calendar viewing parameters.
        Extract the following details from the user's request and return ONLY a JSON object:
        {
          "timeRange": "time range (e.g., 'today', 'tomorrow', 'this week')",
          "startTime": "optional specific start time",
          "endTime": "optional specific end time"
        }
        
        User request: "${input}"`
      );
      
      try {
        const viewDetails = JSON.parse(
          viewDetailsResponse.replace(/```json|```/g, '').trim()
        );
        
        // Default to viewing today's events
        const viewParams = {
          start: viewDetails.timeRange || "today",
          end: viewDetails.timeRange || "today"
        };
        
        if (viewDetails.startTime) viewParams.start += ` ${viewDetails.startTime}`;
        if (viewDetails.endTime) viewParams.end += ` ${viewDetails.endTime}`;
        
        console.log("Viewing calendar with params:", viewParams);
        const result = await viewTool.call(JSON.stringify(viewParams));
        
        // Format the results nicely
        const formattingResponse = await model.call(
          `You are a helpful calendar assistant. The user asked to view their calendar events for ${viewDetails.timeRange || "today"}.
          
          Here are the raw results:
          ${result}
          
          Please format this information in a clean, user-friendly way. If no events were found, let the user know their schedule is clear.`
        );
        
        return NextResponse.json({
          result: formattingResponse,
          steps: [{
            tool: "google_calendar_view",
            input: JSON.stringify(viewParams),
            output: result
          }]
        });
      } catch (error) {
        console.error("Error viewing calendar:", error);
        return NextResponse.json({
          result: "I had trouble accessing your calendar. Please try again with a simpler request.",
          error: String(error)
        });
      }
    } else {
      // Handle other intents
      return NextResponse.json({
        result: "I'm not sure what calendar operation you want to perform. Try asking to create an event or view your calendar.",
        steps: []
      });
    }
  } catch (error: any) {
    console.error("Google Calendar API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
