import axios, { AxiosInstance } from 'axios';

export interface MoodleConfig {
  baseUrl: string;
  token: string;
}

export interface Course {
  id: number;
  fullname: string;
  shortname: string;
  categoryid: number;
  summary: string;
  startdate: number;
  enddate: number;
}

export interface CalendarEvent {
  id: number;
  name: string;
  description: string;
  format: number;
  courseid: number;
  groupid: number;
  userid: number;
  eventtype: string;
  timestart: number;
  timeduration: number;
  timemodified: number;
}

export interface Assignment {
  id: number;
  course: number;
  name: string;
  intro: string;
  duedate: number;
  allowsubmissionsfromdate: number;
  grade: number;
  timemodified: number;
  cutoffdate: number;
}

export interface CourseContent {
  id: number;
  name: string;
  visible: number;
  summary: string;
  modules: Module[];
}

export interface Module {
  id: number;
  name: string;
  modname: string;
  description?: string;
  url?: string;
  modicon?: string;
  contents?: ModuleContent[];
}

export interface ModuleContent {
  type: string;
  filename: string;
  fileurl: string;
  filesize: number;
  timemodified: number;
}

export class MoodleClient {
  private client: AxiosInstance;
  private token: string;

  constructor(config: MoodleConfig) {
    this.token = config.token;
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
    });
  }

  private async callFunction<T>(functionName: string, params: Record<string, any> = {}): Promise<T> {
    try {
      const response = await this.client.get('/webservice/rest/server.php', {
        params: {
          wstoken: this.token,
          wsfunction: functionName,
          moodlewsrestformat: 'json',
          ...params,
        },
      });

      if (response.data.exception) {
        throw new Error(`Moodle API error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to call ${functionName}: ${error.message}`);
      }
      throw error;
    }
  }

  async getCourses(): Promise<Course[]> {
    const data = await this.callFunction<{ courses: Course[] }>('core_enrol_get_users_courses', {
      userid: await this.getUserId(),
    });
    return data.courses || [];
  }

  async getCalendarEvents(courseIds?: number[]): Promise<CalendarEvent[]> {
    const params: Record<string, any> = {
      options: {
        userevents: 1,
        siteevents: 1,
      },
    };

    if (courseIds && courseIds.length > 0) {
      params['events[courseids]'] = courseIds;
    }

    const data = await this.callFunction<{ events: CalendarEvent[] }>('core_calendar_get_calendar_events', params);
    return data.events || [];
  }

  async getUpcomingEvents(days: number = 30): Promise<CalendarEvent[]> {
    const now = Math.floor(Date.now() / 1000);
    const future = now + (days * 24 * 60 * 60);

    const allEvents = await this.getCalendarEvents();
    return allEvents.filter(event =>
      event.timestart >= now && event.timestart <= future
    ).sort((a, b) => a.timestart - b.timestart);
  }

  async getCourseAssignments(courseId: number): Promise<Assignment[]> {
    try {
      const data = await this.callFunction<{ courses: Array<{ assignments: Assignment[] }> }>(
        'mod_assign_get_assignments',
        { courseids: [courseId] }
      );
      return data.courses?.[0]?.assignments || [];
    } catch (error) {
      return [];
    }
  }

  async getAllAssignments(): Promise<Assignment[]> {
    const courses = await this.getCourses();
    const allAssignments: Assignment[] = [];

    for (const course of courses) {
      const assignments = await this.getCourseAssignments(course.id);
      allAssignments.push(...assignments);
    }

    return allAssignments;
  }

  async getUpcomingAssignments(days: number = 30): Promise<Assignment[]> {
    const now = Math.floor(Date.now() / 1000);
    const future = now + (days * 24 * 60 * 60);

    const allAssignments = await this.getAllAssignments();
    return allAssignments
      .filter(assignment => assignment.duedate > 0 && assignment.duedate >= now && assignment.duedate <= future)
      .sort((a, b) => a.duedate - b.duedate);
  }

  async getCourseContent(courseId: number): Promise<CourseContent[]> {
    const data = await this.callFunction<CourseContent[]>('core_course_get_contents', {
      courseid: courseId,
    });
    return data || [];
  }

  async getUserId(): Promise<number> {
    const data = await this.callFunction<{ userid: number }>('core_webservice_get_site_info');
    return data.userid;
  }

  async getSiteInfo(): Promise<any> {
    return await this.callFunction('core_webservice_get_site_info');
  }
}
