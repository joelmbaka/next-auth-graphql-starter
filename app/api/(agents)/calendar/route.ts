import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/auth";
import { ChatNvidiaLLM } from "@/lib/tools/nvidia/ChatNVIDIA";
import { PromptTemplate } from "@langchain/core/prompts";
import { getGoogleCalendarTools } from "@/lib/tools/googleapi/calendar";
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";

// Add this interface at the beginning of the file or before the POST function
interface CalendarEvent {
  summary: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  location?: string;
  description?: string;
  attendees?: any[];
  status?: string;
  eventType?: string;
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

    // Initialize LLM
    const model = new ChatNvidiaLLM({
      apiKey: process.env.NVIDIA_API_KEY || "",
      model: "meta/llama-3.3-70b-instruct",
    });

    // Patch missing methods
    (model as any).disableStreaming = () => {};
    (model as any).getLsParams = () => ({});
    (model as any).callPrompt = async (prompt: any) => {
      return { text: "dummy calendar response" };
    };
    (model as any).call = async (prompt: any, options?: any) => {
      return "dummy calendar call result";
    };

    // Consolidated time functions
    function getTimeInfo(hour?: number, minute: number = 0) {
      const now = new Date();
      if (hour !== undefined) {
        now.setHours(hour, minute, 0, 0);
      }
      return {
        date: now.toISOString().split('T')[0],
        iso: now.toISOString(),
        time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
    }

    // Modified time context function to handle time zones
    function getTimeContext(eventStart: string, eventEnd: string, timeZone: string) {
      const now = new Date();
      const start = new Date(eventStart);
      const end = new Date(eventEnd);

      // Convert current time to the event's timezone
      const currentInEventTZ = new Date(now.toLocaleString('en-US', { timeZone }));

      if (currentInEventTZ < start) return "upcoming";
      if (currentInEventTZ >= start && currentInEventTZ <= end) return "ongoing";
      return "past";
    }

    // Update usage throughout the code
    const today = getTimeInfo().date;
    const exampleStart = getTimeInfo(17).iso; // 5:00 PM today
    const exampleEnd = getTimeInfo(18).iso;   // 6:00 PM today

    // Get Google Calendar tools
    const tools = getGoogleCalendarTools(session.accessToken, model);

    // Calendar query examples for few-shot learning
    const calendarExamples = [
      {
        query: "What's on my calendar today?",
        action: "google_calendar_view",
        action_input: `{"start": "today", "end": "today"}`,
        explanation: "Used the view tool to check today's events"
      },
      {
        query: "Do I have any meetings tomorrow?",
        action: "google_calendar_view",
        action_input: `{"start": "tomorrow", "end": "tomorrow"}`,
        explanation: "Used the view tool to check tomorrow's events"
      },
      {
        query: "What's my schedule for next week?",
        action: "google_calendar_view",
        action_input: `{"start": "next monday", "end": "next sunday"}`,
        explanation: "Used the view tool to see next week's events"
      },
      {
        query: "Show me my events for November 15th",
        action: "google_calendar_view",
        action_input: `{"start": "2023-11-15", "end": "2023-11-15"}`,
        explanation: "Used the view tool with specific date format"
      },
      {
        query: "Am I free this afternoon?",
        action: "google_calendar_view",
        action_input: `{"start": "today 12:00:00", "end": "today 18:00:00"}`,
        explanation: "Used the view tool with time range for today's afternoon"
      }
    ];
    
    // Example selector function with proper typing
    function selectRelevantExamples(input: string) {
      // Simple keyword matching logic
      const relevantExamples = calendarExamples.filter(example => {
        const matchTerms = [
          "today", "tomorrow", "schedule", "free", "busy", "meetings", 
          "calendar", "events", "week", "month", "afternoon", "morning"
        ];
        
        // Check if any match terms are in both the input and example query
        return matchTerms.some(term => 
          input.toLowerCase().includes(term) && 
          example.query.toLowerCase().includes(term)
        );
      });
      
      // Return up to 3 most relevant examples, or at least the first example if none match
      return relevantExamples.length > 0 ? 
        relevantExamples.slice(0, 3) : 
        [calendarExamples[0]];
    }
    
    // Get relevant examples based on user input
    const relevantExamples = selectRelevantExamples(input);
    
    // Create example-enhanced prompt
    let examplesText = "RELEVANT EXAMPLES:\n";
    relevantExamples.forEach(ex => {
      examplesText += `\nQuery: "${ex.query}"\n`;
      examplesText += `Tool: ${ex.action}\n`;
      examplesText += `Input: ${ex.action_input}\n`;
      examplesText += `(${ex.explanation})\n`;
    });
    
    // Add examples to the prompt template
    const promptTemplate = `
    You are a helpful assistant that can create and manage Google Calendar events.

    TOOLS:
    ------
    You have access to the following tools: {tool_names}

    {tools}

    To use a tool, please use the following format:
    
    \`\`\`
    Thought: I need to use a tool to help with this request.
    Action: tool_name
    Action Input: {{
      "param1": "value1",
      "param2": "value2"
    }}
    \`\`\`
    
    CREATING SIMPLE CALENDAR EVENTS:
    - ALWAYS format the calendar input EXACTLY like this (no deviations):
      {{
        "summary": "Event Title",
        "start": {{
          "dateTime": "${exampleStart}"
        }},
        "end": {{
          "dateTime": "${exampleEnd}"
        }}
      }}

    - VERY IMPORTANT: Make sure your JSON is well-formed
    - The input MUST be valid JSON that can be parsed by JSON.parse()
    - Do not add any comments or text before or after the JSON
    - You must escape any quotes inside the summary or description

    COMMON MISTAKES TO AVOID:
    - Never include functions or methods in your JSON
    - Don't use single quotes for JSON properties or values
    - Ensure all brackets and braces are properly closed
    - Don't include undefined or non-JSON values
    
    - Use today's date: ${today}
    - Always specify both start and end times
    - End time should be at least 30 minutes after start time
    - Use ISO format with Z suffix (UTC time)
    
    VIEWING CALENDAR EVENTS:
    - Use google_calendar_view with these exact parameters:
      {{
        "start": "today",
        "end": "tomorrow" 
      }}
    
    ERROR HANDLING:
    - If you get an error response starting with "ERROR:", report this to the user
    - If you get "No events found", tell the user they have no events for that time period
    - Never make up or assume calendar events if the tool doesn't return any
    - If access token errors occur, tell the user they need to sign in again
    
    TIME CONTEXT:
    - When reporting events, ALWAYS include the time context:
      * For upcoming events: "You have an upcoming event 'Team Meeting' from 2:00 PM to 3:00 PM today"
      * For ongoing events: "You currently have an ongoing event 'Team Meeting' until 3:00 PM"
      * For past events: "You had an event 'Team Meeting' that ended at 3:00 PM"

    - When creating events, warn if the time is in the past:
      "Warning: The time you specified is in the past. Do you want to create this event anyway?"
    
    FINAL RESPONSE FORMATTING:
    - When displaying event times to users, ALWAYS convert from UTC to their local time
    - Do not mention "UTC" in your responses - display times in the user's local timezone
    - For event creation confirmations, say: "Event 'Meeting with John' created for 3:00 PM to 4:00 PM today" 
    - For event listings, say: "You have an event 'Team Meeting' from 2:00 PM to 3:00 PM today"
    - When no events are found, say: "You don't have any events scheduled for that time period"
    - Always use 12-hour time format with AM/PM

    When you have a final response for the human, you MUST use:
    {{
      "action": "Final Answer",
      "action_input": "Your detailed response here"
    }}

    HUMAN: {input}
    ASSISTANT: I'll help you with your Google Calendar. {agent_scratchpad}
`;

    const agentRunnable = await createStructuredChatAgent({
      llm: model,
      tools: tools as any,
      prompt: PromptTemplate.fromTemplate(promptTemplate),
    });

    // Execute the agent with a reduced iteration limit
    const executor = AgentExecutor.fromAgentAndTools({
      agent: agentRunnable,
      tools: tools as any,
      verbose: true,
      maxIterations: 4, // Increased slightly but still limited
      returnIntermediateSteps: true, // Return all steps for debugging
    });

    console.log("Executing agent with input:", input);
    const result = await executor.invoke({ input });
    console.log("Agent execution result:", result);

    // Update the final response handling to filter events based on query
    let finalOutput = "";
    if (result.output?.includes("max iterations") || 
        result.output === "Agent stopped due to max iterations.") {
      console.log("Agent hit max iterations. Steps:", result.intermediateSteps);
      
      // Check if there was a specific error in the steps
      const lastStep = result.intermediateSteps?.[result.intermediateSteps.length - 1];
      const errorMessage = lastStep?.observation || "";
      
      if (errorMessage.includes("Bad Request")) {
        finalOutput = "I wasn't able to create your event due to a formatting issue. Please try specifying a clearer time, like 'create an event tomorrow at 5pm called Team Meeting'.";
      } else {
        finalOutput = "I wasn't able to complete your calendar request. Please try again with more specific details about the event time and title.";
      }
    } else {
      // IMPORTANT CHANGE: Extract and use the actual raw calendar data
      // Instead of taking the agent's fabricated answer, we'll use the real API response
      const calendarStep = result.intermediateSteps?.find((step: any) => 
        step.action?.tool === "google_calendar_view" &&
        step.observation && 
        step.observation.includes("[") && 
        step.observation.includes("]")
      );
      
      if (calendarStep) {
        try {
          // Extract the JSON part from the observation
          const jsonStart = calendarStep.observation.indexOf('[');
          const jsonEnd = calendarStep.observation.lastIndexOf(']') + 1;
          const jsonString = calendarStep.observation.slice(jsonStart, jsonEnd);
          
          // Parse the actual calendar response
          let events = JSON.parse(jsonString);
          if (Array.isArray(events) && events.length > 0) {
            // Determine what type of events the user is asking about
            const userQuery = input.toLowerCase();
            const isAppointmentQuery = userQuery.includes('appointment') || 
                                      userQuery.includes('meeting') || 
                                      userQuery.includes('consultation') ||
                                      userQuery.includes('interview');
            const isTaskQuery = userQuery.includes('task') || 
                                userQuery.includes('todo') || 
                                userQuery.includes('assignment');
            const isSocialQuery = userQuery.includes('social') || 
                                 userQuery.includes('party') || 
                                 userQuery.includes('gathering');
            
            // Filter events based on query type
            if (isAppointmentQuery) {
              const filteredEvents = events.filter(event => {
                const eventType = determineEventType(event);
                return eventType === 'appointment';
              });
              
              if (filteredEvents.length > 0) {
                events = filteredEvents;
                finalOutput = `You have ${events.length} appointment${events.length > 1 ? 's' : ''}:\n\n`;
                
                events.forEach((event: any) => {
                  const start = new Date(event.start.dateTime);
                  const end = new Date(event.end.dateTime);
                  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                  
                  const timeInfo = start.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: event.start.timeZone || 'UTC'
                  });
                  
                  finalOutput += `• ${event.summary || 'Meeting'} at ${timeInfo} (${duration} minutes)`;
                  
                  // Add attendees if present
                  if (event.attendees?.length > 0) {
                    const attendees = event.attendees
                      .filter((a: any) => a.email !== session.user.email)
                      .map((a: any) => a.email.split('@')[0])
                      .join(', ');
                    
                    if (attendees) finalOutput += ` with ${attendees}`;
                  }
                  
                  // Add location if available
                  if (event.location) {
                    finalOutput += ` in ${event.location}`;
                  }
                  
                  finalOutput += '\n';
                });
              } else {
                finalOutput = "You don't have any appointments scheduled for this period.";
              }
            } else if (isTaskQuery) {
              const filteredEvents = events.filter(event => {
                const eventType = determineEventType(event);
                return eventType === 'task';
              });
              
              if (filteredEvents.length > 0) {
                events = filteredEvents;
                finalOutput = `You have ${events.length} task${events.length > 1 ? 's' : ''} scheduled:\n\n`;
                
                events.forEach((event: any) => {
                  const start = new Date(event.start.dateTime);
                  const end = new Date(event.end.dateTime);
                  const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                  
                  const timeInfo = start.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    timeZone: event.start.timeZone || 'UTC'
                  });
                  
                  finalOutput += `• ${event.summary || 'Untitled Task'} at ${timeInfo} (${duration} minutes)\n`;
                });
              } else {
                finalOutput = "You don't have any tasks scheduled for this period.";
              }
            } else if (isSocialQuery) {
              const filteredEvents = events.filter(event => {
                const eventType = determineEventType(event);
                return eventType === 'social event';
              });
              
              if (filteredEvents.length > 0) {
                events = filteredEvents;
                finalOutput = `You have ${events.length} social event${events.length > 1 ? 's' : ''} scheduled.\n\n`;
              } else {
                finalOutput = "You don't have any social events scheduled for this period.\n\n";
              }
            } else {
              // General events query
              finalOutput = `You have ${events.length} event${events.length > 1 ? 's' : ''} scheduled.\n\n`;

              // Process each filtered event individually
              events.forEach((event: any) => {
                const start = new Date(event.start.dateTime);
                const end = new Date(event.end.dateTime);
                const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                
                const timeInfo = start.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: event.start.timeZone || 'UTC'
                });
                
                finalOutput += `• ${event.summary || 'Untitled Event'} at ${timeInfo} (${duration} minutes)`;
                
                // Add attendees if present
                if (event.attendees?.length > 0) {
                  const attendees = event.attendees
                    .filter((a: any) => a.email !== session.user.email)
                    .map((a: any) => a.email.split('@')[0])
                    .join(', ');
                  
                  if (attendees) finalOutput += ` with ${attendees}`;
                }
                
                // Add location if available
                if (event.location) {
                  finalOutput += ` in ${event.location}`;
                }
                
                finalOutput += '\n';
              });
            }
          } else {
            finalOutput = "You don't have any events scheduled for that time period";
          }
        } catch (error) {
          console.error("Error parsing calendar response:", error);
          finalOutput = result.output;
        }
      } else {
        finalOutput = result.output;
      }
    }

    // Return the result
    return NextResponse.json({ result: finalOutput });

  } catch (error: any) {
    console.error("Google Calendar API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

// Update the determineEventType function to use Google's official eventType property
function determineEventType(event: any): string {
  // First check if the event has an official Google eventType
  if (event.eventType) {
    switch (event.eventType) {
      case 'outOfOffice':
        return 'out-of-office';
      case 'focusTime':
        return 'focus time';
      case 'workingLocation':
        return 'working location';
      case 'fromGmail':
        return 'appointment'; // Gmail-generated events are often meetings/appointments
      case 'birthday':
        return 'birthday';
      // Handle other official types as needed
    }
  }
  
  // Fall back to custom classification if no official type or just 'default'
  const summary = (event.summary || '').toLowerCase();
  const description = (event.description || '').toLowerCase();
  const duration = calculateEventDurationMinutes(event);
  const hasAttendees = event.attendees && event.attendees.length > 0;
  const hasLocation = !!event.location;
  
  // Update appointment keywords for better detection
  const appointmentKeywords = [
    'meet', 'meeting', 'appointment', 'interview', 'consultation', 
    'doctor', 'dentist', 'call', 'client', 'conference', 
    'discussion', 'session', 'booking', 'reservation', 'checkup',
    'visit', 'review', 'demo', 'presentation', 'workshop'
  ];
  
  // Update the appointment detection logic
  if ((hasAttendees || appointmentKeywords.some(keyword => 
       summary.includes(keyword) || description.includes(keyword))) &&
      (duration >= 15 && duration <= 240)) { // 15min-4hr duration
    return 'appointment';
  }
  
  // Check for social events
  const socialKeywords = ['party', 'celebration', 'dinner', 'lunch', 'coffee', 'drinks', 'hangout', 'gathering'];
  if (socialKeywords.some(keyword => summary.includes(keyword) || description.includes(keyword))) {
    return 'social event';
  }
  
  // Update task detection in determineEventType
  const taskKeywords = [
    'todo', 'task', 'reminder', 'complete', 'finish', 
    'review', 'submit', 'deadline', 'due', 'apply',
    'job', 'assignment', 'errand', 'chore', 'work on',
    'follow up', 'prep', 'prepare', 'organize'
  ];

  if (taskKeywords.some(keyword => 
    summary.includes(keyword) || 
    description.includes(keyword)) ||
    (duration <= 45 && !hasAttendees)) { // Tasks are often shorter and solo
    return 'task';
  }
  
  // Default to generic event
  return 'event';
}

// Helper function to calculate event duration in minutes
function calculateEventDurationMinutes(event: any): number {
  if (!event.start?.dateTime || !event.end?.dateTime) {
    return 60; // Default 1 hour if missing timestamps
  }
  
  const start = new Date(event.start.dateTime);
  const end = new Date(event.end.dateTime);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}
