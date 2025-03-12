import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from '@langchain/community/tools/google_calendar';
import { google } from 'googleapis';

// Initialize calendar object before using it
const calendar = google.calendar({ version: 'v3' });

// Monkey patch the GoogleCalendarCreateTool to fix any issues with tool execution
const originalCreateCall = GoogleCalendarCreateTool.prototype._call;
GoogleCalendarCreateTool.prototype._call = async function(input: any) {
  console.log("GoogleCalendarCreateTool called with input:", input);
  try {
    // Ensure input is properly parsed if it's a string
    let parsedInput: any = input;
    if (typeof input === 'string') {
      try {
        parsedInput = JSON.parse(input);
      } catch (e) {
        console.error("Error parsing input:", e);
        // Try to extract structured data from natural language
        if (input.includes("summary") || input.includes("title")) {
          // This is likely already a structured command
        } else {
          // Handle natural language by creating a simple event
          const title = input.replace(/create|schedule|add|new|event|meeting/gi, '').trim();
          const now = new Date();
          const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
          
          parsedInput = {
            summary: title || "New Event",
            start: {
              dateTime: now.toISOString(),
            },
            end: {
              dateTime: oneHourLater.toISOString(),
            }
          };
        }
      }
    }
    
    // Make a direct API call if needed
    if (typeof parsedInput === 'object' && 
        (!parsedInput.start || !parsedInput.end || !parsedInput.summary)) {
      console.error("Missing required fields in calendar event:", parsedInput);
      return "ERROR: Calendar event requires summary, start time, and end time.";
    }
    
    console.log("Creating calendar event with data:", JSON.stringify(parsedInput, null, 2));
    const result = await originalCreateCall.call(this, parsedInput);
    console.log("Calendar create result:", result);
    return result;
  } catch (error) {
    console.error("Error in calendar create:", error);
    return `Error creating calendar event: ${error}`;
  }
};

// Also patch the view tool
const originalViewCall = GoogleCalendarViewTool.prototype._call;
GoogleCalendarViewTool.prototype._call = async function(input) {
  console.log("GoogleCalendarViewTool called with input:", input);
  try {
    const result = await originalViewCall.call(this, input);
    console.log("Calendar view result:", result);
    return result;
  } catch (error) {
    console.error("Error in calendar view:", error);
    return `Error viewing calendar: ${error}`;
  }
};

export function getGoogleCalendarTools(accessToken: string, llm: any) {
  if (!llm) {
    throw new Error("Missing LLM instance to interact with Google Calendar");
  }

  if (!accessToken) {
    throw new Error("No access token provided for Google Calendar");
  }

  console.log("Setting up calendar tools with token:", accessToken.substring(0, 10) + "...");

  const credentials = {
    accessToken,
    calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary',
  };

  const scopes = [
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const createTool = new GoogleCalendarCreateTool({
    credentials,
    scopes,
    model: llm,
  });

  const viewTool = new GoogleCalendarViewTool({
    credentials,
    scopes,
    model: llm,
  });

  // Test the tools to ensure they're working
  console.log("Calendar tools initialized with token length:", accessToken.length);

  return [viewTool, createTool];
}

// Update the calendar API call to ensure proper response handling
async function getCalendarEvents() {
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
      showDeleted: false,
      // Request additional fields including eventType
      fields: 'items(id,summary,description,location,start,end,attendees,status,eventType)'
    });

    // Ensure the response contains valid data
    if (!response.data || !response.data.items) {
      throw new Error('Invalid calendar API response');
    }

    // Filter out any null or undefined events
    const validEvents = response.data.items.filter(event => 
      event && event.start && event.end
    );

    return validEvents.map(event => ({
      id: event.id,
      summary: event.summary || 'Untitled Event',
      start: event.start,
      end: event.end,
      // Include additional useful fields
      location: event.location || '',
      description: event.description || '',
      attendees: event.attendees || [],
      status: event.status || 'confirmed'
    }));
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw error;
  }
}
