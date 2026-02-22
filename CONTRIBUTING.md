# Contributing to Mission Control 🚀

Thank you for your interest in contributing to Mission Control! We welcome contributions from the community.

## Getting Started

1. **Fork the repository**
   ```bash
   gh repo fork amzu-dev/mission-control --clone
   cd mission-control
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Make your changes**

5. **Test your changes**
   - Ensure the app runs without errors
   - Test all features you modified
   - Check responsiveness on different screen sizes

6. **Commit your changes**
   ```bash
   git add .
   git commit -m "Description of your changes"
   ```

7. **Push to your fork**
   ```bash
   git push origin main
   ```

8. **Create a Pull Request**
   ```bash
   gh pr create
   ```

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing code formatting
- Use meaningful variable and function names
- Add comments for complex logic

### Component Structure
- Keep components small and focused
- Use TypeScript interfaces for props
- Extract reusable logic into hooks or utilities

### Styling
- Use Tailwind CSS utility classes
- Follow the Bloomberg Terminal aesthetic (dark theme, orange accents)
- Ensure consistency with existing UI

### API Routes
- Use proper error handling
- Return consistent response formats
- Add appropriate HTTP status codes

## What to Contribute

We welcome:
- 🐛 **Bug fixes**
- ✨ **New features**
- 📚 **Documentation improvements**
- 🎨 **UI/UX enhancements**
- 🧪 **Tests**
- 🌐 **Translations**

## Reporting Issues

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, Node version, etc.)

## Questions?

Feel free to:
- Open an issue for discussion
- Join the OpenClaw Discord: [discord.com/invite/clawd](https://discord.com/invite/clawd)

Thank you for contributing! 🙏
