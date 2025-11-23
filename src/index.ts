#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { MoodleClient } from './moodle-client.js';

dotenv.config();

const MOODLE_URL = process.env.MOODLE_URL;
const MOODLE_TOKEN = process.env.MOODLE_TOKEN;

if (!MOODLE_URL || !MOODLE_TOKEN) {
  console.error('Error: MOODLE_URL and MOODLE_TOKEN must be set in .env file');
  process.exit(1);
}

const moodleClient = new MoodleClient({
  baseUrl: MOODLE_URL,
  token: MOODLE_TOKEN,
});

const server = new Server(
  {
    name: 'moodle-connect-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const tools: Tool[] = [
  {
    name: 'get_courses',
    description: 'Get all enrolled courses for the user. Returns course information including names, dates, and summaries.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_calendar_events',
    description: 'Get calendar events. Can filter by course IDs or get all events.',
    inputSchema: {
      type: 'object',
      properties: {
        courseIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional array of course IDs to filter events',
        },
      },
    },
  },
  {
    name: 'get_upcoming_events',
    description: 'Get upcoming calendar events within a specified number of days. Useful for checking deadlines and scheduled activities.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look ahead (default: 30)',
          default: 30,
        },
      },
    },
  },
  {
    name: 'get_assignments',
    description: 'Get assignments for a specific course or all courses.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'number',
          description: 'Course ID to get assignments for. If not provided, gets all assignments.',
        },
      },
    },
  },
  {
    name: 'get_upcoming_assignments',
    description: 'Get upcoming assignments with deadlines within a specified number of days. Perfect for tracking what needs to be submitted soon.',
    inputSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look ahead (default: 30)',
          default: 30,
        },
      },
    },
  },
  {
    name: 'get_course_content',
    description: 'Get detailed content and materials for a specific course including modules, resources, and activities.',
    inputSchema: {
      type: 'object',
      properties: {
        courseId: {
          type: 'number',
          description: 'Course ID to get content for',
        },
      },
      required: ['courseId'],
    },
  },
  {
    name: 'get_site_info',
    description: 'Get information about the Moodle site and current user.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_courses': {
        const courses = await moodleClient.getCourses();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(courses, null, 2),
            },
          ],
        };
      }

      case 'get_calendar_events': {
        const courseIds = args?.courseIds as number[] | undefined;
        const events = await moodleClient.getCalendarEvents(courseIds);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(events, null, 2),
            },
          ],
        };
      }

      case 'get_upcoming_events': {
        const days = (args?.days as number) || 30;
        const events = await moodleClient.getUpcomingEvents(days);

        const formatted = events.map(event => {
          const date = new Date(event.timestart * 1000);
          return {
            name: event.name,
            description: event.description,
            date: date.toISOString(),
            dateFormatted: date.toLocaleDateString() + ' ' + date.toLocaleTimeString(),
            eventType: event.eventtype,
            courseId: event.courseid,
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case 'get_assignments': {
        const courseId = args?.courseId as number | undefined;
        let assignments;

        if (courseId) {
          assignments = await moodleClient.getCourseAssignments(courseId);
        } else {
          assignments = await moodleClient.getAllAssignments();
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(assignments, null, 2),
            },
          ],
        };
      }

      case 'get_upcoming_assignments': {
        const days = (args?.days as number) || 30;
        const assignments = await moodleClient.getUpcomingAssignments(days);

        const formatted = assignments.map(assignment => {
          const dueDate = new Date(assignment.duedate * 1000);
          const now = new Date();
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          return {
            name: assignment.name,
            courseId: assignment.course,
            dueDate: dueDate.toISOString(),
            dueDateFormatted: dueDate.toLocaleDateString() + ' ' + dueDate.toLocaleTimeString(),
            daysUntilDue,
            description: assignment.intro,
            maxGrade: assignment.grade,
          };
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2),
            },
          ],
        };
      }

      case 'get_course_content': {
        const courseId = args?.courseId as number;
        if (!courseId) {
          throw new Error('courseId is required');
        }

        const content = await moodleClient.getCourseContent(courseId);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(content, null, 2),
            },
          ],
        };
      }

      case 'get_site_info': {
        const info = await moodleClient.getSiteInfo();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(info, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Moodle MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
