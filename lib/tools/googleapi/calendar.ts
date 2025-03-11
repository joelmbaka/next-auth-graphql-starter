import {
  GoogleCalendarCreateTool,
  GoogleCalendarViewTool,
} from '@langchain/community/tools/google_calendar';
import { google } from 'googleapis';

// Initialize calendar object before using it
const calendar = google.calendar({ version: 'v3' });

export function getGoogleCalendarTools(accessToken: string, llm: any) {
  if (!llm) {
    throw new Error("Missing llm instance to interact with Google Calendar");
  }

  if (!accessToken) {
    console.error("No access token provided for Google Calendar");
    throw new Error("No access token provided for Google Calendar");
  }

  // Better logging for debugging
  console.log("Setting up Google Calendar with access token:", 
    accessToken ? accessToken.substring(0, 10) + "..." : "MISSING");

  const credentials = {
    accessToken,
    calendarId: process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary',
  };

  console.log("Using Calendar ID:", process.env.GOOGLE_CALENDAR_CALENDAR_ID || 'primary');

  // Make a test call to the API to verify credentials
  async function testCalendarAccess() {
    try {
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${credentials.calendarId}/events?maxResults=1`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      
      if (response.status === 401) {
        console.error("Calendar access denied - invalid or expired access token");
        throw new Error("Calendar access denied - please reauthenticate");
      }
      
      if (!response.ok) {
        const error = await response.text();
        console.error("Calendar API test failed:", error);
        return false;
      }
      
      const data = await response.json();
      console.log("Calendar API test successful, found events:", !!data.items?.length);
      return true;
    } catch (error) {
      console.error("Error testing calendar access:", error);
      throw error; // Rethrow to prevent invalid token usage
    }
  }

  // Test access immediately
  testCalendarAccess().then(success => {
    console.log("Calendar access test result:", success ? "SUCCESS" : "FAILED");
  });

  // Update the createEventDirect function to support more features
  async function createEventDirect(eventData: any) {
    try {
      // Add default values for optional fields
      const fullEventData = {
        ...eventData,
        reminders: {
          useDefault: true // Use default reminders unless overridden
        },
        conferenceData: eventData.conferenceData || null,
        recurrence: eventData.recurrence || null,
        attendees: eventData.attendees || [],
        description: eventData.description || '',
        location: eventData.location || '',
        // Ensure time zones are properly set
        start: {
          ...eventData.start,
          timeZone: eventData.start.timeZone || 'UTC'
        },
        end: {
          ...eventData.end,
          timeZone: eventData.end.timeZone || 'UTC'
        }
      };

      console.log("Creating event with full details:", JSON.stringify(fullEventData, null, 2));
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${credentials.calendarId}/events`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(fullEventData),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error creating event:", errorText);
        return `ERROR creating event: ${response.status} ${response.statusText}. Details: ${errorText}`;
      }
      
      const data = await response.json();
      console.log("Event created successfully:", data);
      
      // Format a nice response with important details
      let responseText = `Event '${data.summary}' created successfully.`;
      if (data.start?.dateTime) {
        const startTime = new Date(data.start.dateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: data.start.timeZone || 'UTC'
        });
        const endTime = new Date(data.end.dateTime).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          timeZone: data.end.timeZone || 'UTC'
        });
        responseText += ` It's scheduled from ${startTime} to ${endTime}.`;
      }
      
      if (data.conferenceData?.entryPoints) {
        const meetLink = data.conferenceData.entryPoints.find(
          (ep: any) => ep.entryPointType === 'video'
        )?.uri;
        if (meetLink) {
          responseText += ` Google Meet link: ${meetLink}`;
        }
      }
      
      return responseText;
      
    } catch (error) {
      console.error("Exception creating event:", error);
      return `ERROR creating event: ${error}`;
    }
  }

  // Enhanced create tool that uses our direct API
  const createTool = new GoogleCalendarCreateTool({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
    model: llm,
  });

  // Update the create tool implementation to handle more error cases
  createTool._call = async function(input: string) {
    try {
      console.log("Calendar create input (raw):", input);
      
      // Parse and validate input with more robust error handling
      let parsedInput: any;
      try {
        // First, check if input is already an object
        if (typeof input === 'object' && input !== null) {
          parsedInput = input;
        } 
        // Next, try to parse as JSON if it's a string
        else if (typeof input === 'string') {
          // Handle common LLM formatting issues
          let cleanedInput = input
            .replace(/^```json\s*/i, '') // Remove markdown code block starters
            .replace(/\s*```$/i, '');    // Remove markdown code block enders
            
          if (cleanedInput.startsWith('"') && cleanedInput.endsWith('"')) {
            // Handle double-escaped JSON
            cleanedInput = JSON.parse(cleanedInput);
          }
          
          // If there's text before or after the JSON object, try to extract just the JSON
          const jsonMatch = cleanedInput.match(/(\{[\s\S]*\})/);
          if (jsonMatch && jsonMatch[1]) {
            cleanedInput = jsonMatch[1];
          }
          
          parsedInput = JSON.parse(cleanedInput);
        } else {
          return "ERROR: Invalid input format for calendar event.";
        }
        
        console.log("Calendar create parsed input:", parsedInput);
      } catch (e) {
        console.error("Failed to parse calendar input:", e);
        
        // Extract text description from non-JSON input and create a simple event
        if (typeof input === 'string') {
          // Try to extract meaningful info from natural language
          const titleMatch = input.match(/called\s+"?([^"]+)"?|titled\s+"?([^"]+)"?|title\s+"?([^"]+)"?|event\s+"?([^"]+)"?|"([^"]+)"/i);
          const timeMatch = input.match(/at\s+(\d{1,2}[:.]?\d{0,2}\s*[ap]m)/i);
          const durationMatch = input.match(/for\s+(\d+)\s*(hour|hr|min|minute)/i);
          
          if (titleMatch && timeMatch) {
            const title = titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4] || titleMatch[5] || "Unnamed Event";
            const timeStr = timeMatch[1];
            
            // Parse the time
            let eventHour = 0;
            let eventMinute = 0;
            const isPM = /pm/i.test(timeStr);
            
            const timeParts = timeStr.replace(/[^0-9:\.]/g, '').split(/[:\.]/);
            eventHour = parseInt(timeParts[0]);
            if (isPM && eventHour < 12) eventHour += 12;
            eventMinute = timeParts.length > 1 ? parseInt(timeParts[1]) : 0;
            
            // Calculate duration
            let durationMinutes = 60; // Default 1 hour
            if (durationMatch) {
              const durationValue = parseInt(durationMatch[1]);
              const durationUnit = durationMatch[2].toLowerCase();
              durationMinutes = durationUnit.startsWith('hour') || durationUnit.startsWith('hr') 
                ? durationValue * 60 
                : durationValue;
            }
            
            // Tomorrow if specified
            const tomorrow = input.toLowerCase().includes('tomorrow');
            const date = new Date();
            if (tomorrow) date.setDate(date.getDate() + 1);
            
            date.setHours(eventHour, eventMinute, 0, 0);
            const endDate = new Date(date);
            endDate.setMinutes(date.getMinutes() + durationMinutes);
            
            // Check for video conference request
            const wantsVideo = input.toLowerCase().includes('video call') || 
                               input.toLowerCase().includes('google meet') ||
                               input.toLowerCase().includes('zoom');
            
            // Create parsedInput from extracted data
            parsedInput = {
              summary: title,
              start: {
                dateTime: date.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              },
              end: {
                dateTime: endDate.toISOString(),
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
              },
              description: input, // Use the full input as description
              ...(wantsVideo && {
                conferenceData: {
                  createRequest: {
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                    requestId: Math.random().toString(36).substring(2, 15)
                  }
                }
              })
            };
            
            console.log("Created event from natural language:", parsedInput);
          } else {
            return "ERROR: Could not extract event title and time from your request. Please provide a clear title and time.";
          }
        } else {
          return "ERROR: Could not parse event data. Please provide valid JSON or a clear description.";
        }
      }
      
      // Ensure required fields are present
      if (!parsedInput.summary) {
        return "ERROR: Event must have a summary/title.";
      }
      
      if (!parsedInput.start || !parsedInput.end) {
        return "ERROR: Event must have both start and end times.";
      }
      
      // Use our direct API implementation instead of the tool's implementation
      return await createEventDirect(parsedInput);
      
    } catch (error) {
      console.error("Calendar create tool error:", error);
      return `ERROR: ${error}`;
    }
  };

  // Also enhance the view tool with better error handling
  const viewTool = new GoogleCalendarViewTool({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/calendar.readonly",
    ],
    model: llm,
  });

  const originalViewFunc = viewTool._call.bind(viewTool);
  viewTool._call = async function(input: string) {
    try {
      console.log("Calendar view input:", input);
      
      // Ensure we request the needed fields for event type classification
      let parsedInput;
      try {
        parsedInput = typeof input === 'string' ? JSON.parse(input) : input;
      } catch (e) {
        parsedInput = input;
      }
      
      // Add fields parameter if using the Google API directly
      if (typeof parsedInput === 'object') {
        parsedInput.fields = 'items(id,summary,description,location,start,end,attendees,status,eventType)';
      }
      
      const result = await originalViewFunc(typeof parsedInput === 'object' ? JSON.stringify(parsedInput) : input);
      console.log("Calendar view result:", result);
      return result;
    } catch (error) {
      console.error("Calendar view error:", error);
      return `ERROR accessing calendar: ${error}`;
    }
  };

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
