# CustomLicenser

A flexible VS Code extension that streamlines license management for your projects. Choose from popular open-source licenses or create your own custom licensing terms—perfect for developers, creators, and teams who need precise control over how their work is shared and used.

## ✨ Features

-   **Quick License Insertion**: Add licenses to your files with a single command
-   **Popular License Templates**: Built-in support for common licenses:
    -   MIT License
    -   GNU GPL v3
    -   Apache License 2.0
    -   BSD 3-Clause License
    -   ISC License
    -   Mozilla Public License 2.0
-   **Custom License Support**: Create and save your own licensing terms
-   **Auto-Insert on Save**: Automatically add license headers to new files (configurable)
-   **License Validation**: Warns when files are missing license headers
-   **Multi-Language Support**: Works with various programming languages and file types
-   **Customizable Headers**: Configure license header format and placement

## 🚀 Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X / Cmd+Shift+X)
3. Search for "CustomLicenser"
4. Click Install

### Manual Installation

1. Download the `.vsix` file from releases
2. In VS Code, go to Extensions
3. Click the "..." menu and select "Install from VSIX..."
4. Select the downloaded file

## 📖 Usage

### Quick Start

1. **Open a file** where you want to add a license
2. **Open Command Palette** (Ctrl+Shift+P / Cmd+Shift+P)
3. **Type "License"** to see available commands
4. **Select your desired license** (e.g., "Add MIT License")

### Available Commands

| Command                                      | Description                             |
| -------------------------------------------- | --------------------------------------- |
| `CustomLicenser: Add MIT License`            | Insert MIT license header               |
| `CustomLicenser: Add GPL v3 License`         | Insert GNU GPL v3 license header        |
| `CustomLicenser: Add Apache 2.0 License`     | Insert Apache 2.0 license header        |
| `CustomLicenser: Add BSD 3-Clause License`   | Insert BSD 3-Clause license header      |
| `CustomLicenser: Add ISC License`            | Insert ISC license header               |
| `CustomLicenser: Add Mozilla Public License` | Insert MPL 2.0 license header           |
| `CustomLicenser: Add Custom License`         | Create and insert custom license        |
| `CustomLicenser: Manage Custom Licenses`     | View and edit saved custom licenses     |
| `CustomLicenser: Check License Coverage`     | Scan project for files missing licenses |
| `CustomLicenser: Configure Settings`         | Open extension settings                 |

### Example Output

When you add an MIT license to a JavaScript file, it will insert:

```javascript
/**
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

## ⚙️ Configuration

Configure the extension through VS Code settings:

```json
{
	"customlicenser.defaultAuthor": "Your Name",
	"customlicenser.defaultEmail": "your.email@example.com",
	"customlicenser.autoInsertOnSave": true,
	"customlicenser.fileExtensions": [".js", ".ts", ".py", ".java", ".cpp"],
	"customlicenser.headerStyle": "block-comment",
	"customlicenser.insertAtTop": true,
	"customlicenser.skipExistingLicense": true
}
```

### Settings Reference

| Setting               | Type    | Default               | Description                                                    |
| --------------------- | ------- | --------------------- | -------------------------------------------------------------- |
| `defaultAuthor`       | string  | ""                    | Default author name for license headers                        |
| `defaultEmail`        | string  | ""                    | Default email for license headers                              |
| `autoInsertOnSave`    | boolean | false                 | Automatically add license to new files on save                 |
| `fileExtensions`      | array   | [".js", ".ts", ".py"] | File types to auto-license                                     |
| `headerStyle`         | string  | "block-comment"       | Comment style: "block-comment", "line-comment", "hash-comment" |
| `insertAtTop`         | boolean | true                  | Insert license at file beginning                               |
| `skipExistingLicense` | boolean | true                  | Skip files that already have licenses                          |

## 🎨 Custom Licenses

### Creating Custom Licenses

1. Run `CustomLicenser: Add Custom License`
2. Enter your license name
3. Write your license text (supports variables like `{{AUTHOR}}`, `{{YEAR}}`)
4. Save and use immediately

### Custom License Variables

Use these variables in your custom licenses:

-   `{{AUTHOR}}` - Author name from settings
-   `{{EMAIL}}` - Email from settings
-   `{{YEAR}}` - Current year
-   `{{DATE}}` - Current date
-   `{{FILENAME}}` - Current file name
-   `{{PROJECT}}` - Project/workspace name

### Example Custom License

```
Proprietary License

Copyright (c) {{YEAR}} {{AUTHOR}}

This software is proprietary and confidential. Unauthorized copying
of this file, via any medium, is strictly prohibited.

Contact: {{EMAIL}}
```

## 🔧 Development

### Prerequisites

-   Node.js 16+
-   VS Code 1.102.0+

### Setup

```bash
git clone https://github.com/yourusername/customlicenser
cd customlicenser
npm install
```

### Testing

```bash
npm run test
```

### Building

```bash
npm run package
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🐛 Issues & Support

-   **Bug Reports**: [GitHub Issues](https://github.com/yourusername/customlicenser/issues)
-   **Feature Requests**: [GitHub Issues](https://github.com/yourusername/customlicenser/issues)
-   **Documentation**: [Wiki](https://github.com/yourusername/customlicenser/wiki)

## 🎯 Roadmap

-   [ ] License template editor with syntax highlighting
-   [ ] Bulk license insertion for entire projects
-   [ ] Integration with popular package managers
-   [ ] License compatibility checker
-   [ ] Export/import custom license collections
-   [ ] Team license template sharing

## 📊 Stats

![VS Code Marketplace](https://img.shields.io/visual-studio-marketplace/v/customlicenser)
![Downloads](https://img.shields.io/visual-studio-marketplace/d/customlicenser)
![Rating](https://img.shields.io/visual-studio-marketplace/r/customlicenser)

---

Made with ❤️ by developers, for developers.
