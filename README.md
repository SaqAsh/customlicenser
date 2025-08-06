# CustomLicenser

A VS Code extension for adding license headers to your code files. Choose from standard licenses or create custom ones.

## Features

-   **Standard Licenses**: MIT, GPL v3, Apache 2.0, BSD 3-Clause, ISC, Mozilla Public License
-   **Custom Licenses**: Create and save your own license templates
-   **Auto-Insert**: Automatically add licenses to new files on save
-   **Multi-Language**: Supports JavaScript, TypeScript, Python, Java, C++, C
-   **Template Variables**: Use `{{name}}`, `{{year}}` in custom licenses

## Installation

1. Open VS Code Extensions (Ctrl+Shift+X)
2. Search "CustomLicenser"
3. Install

## Usage

### Quick Start

1. Open a file
2. Press Ctrl+Shift+P
3. Type "CustomLicenser" to see commands
4. Select your license

### Commands

| Command                      | Description                         |
| ---------------------------- | ----------------------------------- |
| `Add MIT License`            | Add MIT license header              |
| `Add GPL v3 License`         | Add GPL v3 license header           |
| `Add Apache 2.0 License`     | Add Apache license header           |
| `Add BSD 3-Clause License`   | Add BSD license header              |
| `Add ISC License`            | Add ISC license header              |
| `Add Mozilla Public License` | Add Mozilla license header          |
| `Select License to Add`      | Choose from available licenses      |
| `Create Custom License`      | Create new custom license template  |
| `Edit Custom License`        | Edit existing custom licenses       |
| `Select Default License`     | Set default license for auto-insert |
| `Toggle Auto Add On Save`    | Enable/disable auto-insert          |
| `Add Year`                   | Set year for license headers        |
| `Add Author Name`            | Set author name for headers         |
| `Configure Settings`         | Open extension settings             |

### Example Output

MIT license in JavaScript:

```javascript
/*
 * MIT License
 *
 * Copyright (c) 2024 Your Name
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
```

## Configuration

```json
{
	"customlicenser.defaultAuthor": "Your Name",
	"customlicenser.defaultEmail": "your.email@example.com",
	"customlicenser.autoInsertOnSave": false,
	"customlicenser.fileExtensions": [".js", ".ts", ".py", ".java", ".cpp"],
	"customlicenser.headerStyle": "block-comment",
	"customlicenser.insertAtTop": true,
	"customlicenser.skipExistingLicense": true,
	"customlicenser.authorName": "Your Name",
	"customlicenser.authorEmail": "your.email@example.com",
	"customlicenser.year": "2024"
}
```

### Settings

| Setting               | Type    | Default                                | Description              |
| --------------------- | ------- | -------------------------------------- | ------------------------ |
| `defaultAuthor`       | string  | ""                                     | Default author name      |
| `defaultEmail`        | string  | ""                                     | Default email            |
| `autoInsertOnSave`    | boolean | false                                  | Auto-add license on save |
| `fileExtensions`      | array   | [".js", ".ts", ".py", ".java", ".cpp"] | File types to process    |
| `headerStyle`         | string  | "block-comment"                        | Comment style            |
| `insertAtTop`         | boolean | true                                   | Insert at file beginning |
| `skipExistingLicense` | boolean | true                                   | Skip files with licenses |

## Custom Licenses

### Creating Custom Licenses

1. Run `Create Custom License`
2. Enter template name
3. Write license text with variables
4. Save to use immediately

### Template Variables

-   `{{name}}` - Author name
-   `{{year}}` - Current year

### Example Custom License

```
Proprietary License

Copyright (c) {{year}} {{name}}

This software is proprietary and confidential.
Unauthorized copying is strictly prohibited.
```

## Development

### Prerequisites

-   Node.js 16+
-   VS Code 1.102.0+

### Setup

```bash
git clone <repository>
cd customlicenser
npm install
npm run build
```

### Testing

```bash
npm run test
```

## Roadmap

-   [ ] License coverage reporting
-   [ ] Bulk license insertion
-   [ ] License template editor
-   [ ] Export/import license collections
-   [ ] Team template sharing

## License

MIT License - see LICENSE file for details.
