# Moodle Connect MCP

A Model Context Protocol (MCP) server that allows Claude Desktop to interact with Moodle. Access your courses, calendar events, assignments, deadlines, and course materials directly through Claude.

## Features

- **Course Management**: View all your enrolled courses
- **Calendar Integration**: Check upcoming events and deadlines
- **Assignment Tracking**: See all assignments and their due dates
- **Course Content**: Access course materials and resources
- **Smart Filtering**: Get upcoming items within specific time ranges

## Prerequisites

- Node.js 18 or higher
- A Moodle account with web services enabled
- Claude Desktop app

## Setup Instructions

### 1. Get Your Moodle Web Service Token

You need to obtain a web service token from your Moodle site:

#### Option A: Using Moodle's Token Generation Page

1. Log in to your Moodle site
2. Go to your user preferences: `Dashboard` → `Preferences` → `User account` → `Security keys`
3. Look for "Web services access tokens" or similar
4. Create a new token or copy an existing one

#### Option B: Direct URL Method

1. Navigate to: `https://your-moodle-site.com/admin/settings.php?section=webservicetokens`
2. Create a new token for your user account
3. Copy the generated token

#### Option C: Ask Your Administrator

If you cannot access the token generation pages:
1. Contact your Moodle site administrator
2. Request a web services token for external application access
3. They may need to enable web services for your account first

**Important**: Keep your token secure - it provides full access to your Moodle account!

### 2. Install the MCP Server

Clone and set up the project:

```bash
# Clone the repository
git clone https://github.com/yourusername/moodle-connect-mcp.git
cd moodle-connect-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### 3. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Moodle credentials:

```env
MOODLE_URL=https://your-moodle-site.com
MOODLE_TOKEN=your_web_service_token_here
```

### 4. Test the Connection (Recommended)

Before configuring Claude Desktop, test that everything works:

```bash
# Run the simple connectivity test
npm test
```

This will:
- ✅ Verify your Moodle URL and token are correct
- ✅ Show your enrolled courses
- ✅ Display upcoming assignments
- ✅ List calendar events

**Expected output:**
```
🔍 Testing Moodle Connection...
✅ Connected successfully!
   Site: Your Moodle Site Name
   User: Your Name (username)

✅ Found 5 courses:
   - Course Name 1 (ID: 123)
   - Course Name 2 (ID: 456)
   ...
```

**If you see errors:**
- Verify your MOODLE_URL includes `https://`
- Check your token is correct
- Ensure web services are enabled on your Moodle site
- Contact your Moodle administrator if needed

**Optional: Test the full MCP protocol**
```bash
npm run test:mcp
```

This tests the JSON-RPC communication between the MCP server and clients.

### 5. Configure Claude Desktop

Add the MCP server to your Claude Desktop configuration:

#### On macOS

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

#### On Windows

Edit: `%APPDATA%\Claude\claude_desktop_config.json`

#### On Linux

Edit: `~/.config/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "moodle": {
      "command": "node",
      "args": ["/absolute/path/to/moodle-connect-mcp/dist/index.js"],
      "env": {
        "MOODLE_URL": "https://your-moodle-site.com",
        "MOODLE_TOKEN": "your_web_service_token_here"
      }
    }
  }
}
```

**Replace** `/absolute/path/to/moodle-connect-mcp` with the actual path to your installation.

### 6. Restart Claude Desktop

Restart Claude Desktop to load the new MCP server.

## Usage Examples

Once configured, you can ask Claude things like:

- "What are my upcoming assignments?"
- "Show me all my courses"
- "What events do I have this week?"
- "What's due in the next 7 days?"
- "Show me the content for course ID 123"
- "What tests do I need to take soon?"
- "When is my next deadline?"

## Available Tools

The server provides the following tools to Claude:

### `get_courses`
Get all courses you're enrolled in, including course names, summaries, and dates.

### `get_calendar_events`
Get calendar events, optionally filtered by course IDs.

### `get_upcoming_events`
Get upcoming calendar events within a specified number of days (default: 30 days).

### `get_assignments`
Get assignments for a specific course or all courses.

### `get_upcoming_assignments`
Get assignments due within a specified number of days (default: 30 days).

### `get_course_content`
Get detailed content and materials for a specific course.

### `get_site_info`
Get information about your Moodle site and user account.

## Troubleshooting

### "Error: MOODLE_URL and MOODLE_TOKEN must be set"

Make sure your `.env` file exists and contains valid values, or that you've set the environment variables in the Claude Desktop configuration.

### "Moodle API error: Invalid token"

Your token may be expired or incorrect. Generate a new token from your Moodle site.

### "Failed to call [function]: Network Error"

- Check that your `MOODLE_URL` is correct and accessible
- Ensure your Moodle site has web services enabled
- Verify you're not behind a firewall blocking the connection

### MCP Server Not Showing in Claude Desktop

- Verify the path in `claude_desktop_config.json` is absolute and correct
- Make sure you've run `npm run build` to compile TypeScript
- Check Claude Desktop logs for errors
- Restart Claude Desktop after configuration changes

### Web Services Not Enabled on Moodle

If you get errors about web services not being available:
1. Contact your Moodle administrator
2. They need to enable "Web services" in Moodle site administration
3. The "REST protocol" must be enabled
4. Your user account needs permission to use web services

## Development

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Watch for changes during development
npm run watch
```

## Security Notes

- **Never commit your `.env` file** - it contains sensitive credentials
- Keep your Moodle token secure and private
- The token provides full access to your Moodle account
- Regenerate your token if you suspect it has been compromised

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify your Moodle web services are properly configured
3. Open an issue on GitHub with details about your problem
