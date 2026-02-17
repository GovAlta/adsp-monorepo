# Nx Monorepo Skills

This document provides AI agents with comprehensive guidance for working with Nx monorepos.

## Core Concepts

### What is Nx?
Nx is a build system and monorepo management tool that provides:
- **Project graph**: Understanding of dependencies between projects
- **Task orchestration**: Parallel execution with correct ordering
- **Caching**: Local and remote caching of build/test results
- **Affected commands**: Run tasks only for changed projects

### Project Types
- **Applications** (`projectType: "application"`): Deployable services/apps (in `apps/`)
- **Libraries** (`projectType: "library"`): Shared code (in `libs/`)

---

## Essential Commands

### Project Discovery
```bash
# List all projects
nx show projects

# List only applications
nx show projects --type app

# List only libraries  
nx show projects --type lib

# Filter by name pattern
nx show projects --pattern "*-service"

# View project details
nx show project <project-name>

# Open interactive dependency graph
nx graph
```

### Building
```bash
# Build a specific project
nx build <project-name>

# Build with production configuration
nx build <project-name> --configuration=production

# Build multiple projects
nx run-many -t build -p project1,project2

# Build all projects
nx run-many -t build --all
```

### Testing
```bash
# Run tests for a project
nx test <project-name>

# Run tests with coverage
nx test <project-name> --coverage

# Run tests in watch mode
nx test <project-name> --watch

# Run tests with CI configuration
nx test <project-name> --configuration=ci
```

### Linting
```bash
# Lint a project
nx lint <project-name>

# Lint and auto-fix
nx lint <project-name> --fix
```

### Serving/Running
```bash
# Serve an application (with hot reload)
nx serve <project-name>

# Run any custom target
nx run <project-name>:<target>

# Run with specific configuration
nx run <project-name>:<target>:<configuration>
```

### Affected Commands
Run tasks only for projects affected by changes:
```bash
# Test affected projects (compared to main branch)
nx affected -t test

# Build affected projects
nx affected -t build

# Compare against specific base
nx affected -t test --base=origin/main --head=HEAD

# List affected projects without running
nx show projects --affected
```

---

## Understanding project.json

Each project has a `project.json` defining its configuration:

```json
{
  "name": "my-service",
  "projectType": "application",
  "sourceRoot": "apps/my-service/src",
  "tags": ["type:service", "scope:platform"],
  "targets": {
    "build": {
      "executor": "@nx/webpack:webpack",
      "options": {
        "outputPath": "dist/apps/my-service",
        "main": "apps/my-service/src/main.ts"
      },
      "configurations": {
        "production": {
          "optimization": true
        }
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "options": {
        "jestConfig": "apps/my-service/jest.config.ts"
      }
    }
  }
}
```

Key elements:
- **executor**: The tool that runs the target (e.g., `@nx/jest:jest`)
- **options**: Default options passed to the executor
- **configurations**: Named option overrides (use with `--configuration=name`)

---

## Caching

### How it works
- Nx caches task outputs based on inputs (source files, dependencies, env vars)
- Cache hits skip task execution and restore outputs
- Cache status shown in task output: `[local cache]` or `[remote cache]`

### Managing the cache
```bash
# Clear the local cache
nx reset

# View cache directory
ls .nx/cache

# Skip cache for a run
nx build <project> --skip-nx-cache
```

### When to clear cache
- After changing global configs (`nx.json`, `tsconfig.base.json`)
- When seeing stale build outputs
- After upgrading Nx or dependencies
- When builds behave unexpectedly

---

## Multi-Language Support

Nx supports projects in multiple languages through plugins:

### Node.js/TypeScript
- Default support via `@nx/node`, `@nx/webpack`, `@nx/jest`
- Most common in this workspace

### .NET
- Plugin: `@nx-dotnet/core`
- Commands: `nx build <dotnet-project>`, `nx test <dotnet-project>`
- Uses standard .NET tooling under the hood

### Python
- Plugin: `@nxlv/python`
- Manages Python projects with Poetry or pip
- Typical targets: `build`, `test`, `lint`

### Java/Spring Boot
- Plugin: `@nxrocks/nx-spring-boot`
- Wraps Maven/Gradle commands
- Targets may include: `build`, `test`, `serve`

---

## Troubleshooting

### Task fails unexpectedly
```bash
# Clear cache and retry
nx reset
nx build <project-name>

# Run with verbose output
nx build <project-name> --verbose
```

### Dependency issues
```bash
# Regenerate dependency graph
nx reset

# View why a project is affected
nx graph --focus=<project-name>
```

### Finding the right command
```bash
# List available targets for a project
nx show project <project-name>

# See what commands would run (dry run)
nx build <project-name> --dry-run
```

### Common errors

**"Cannot find project"**
- Check project name spelling (use `nx show projects` to list)
- Ensure project has a valid `project.json`

**"Target not found"**
- Project may not have that target defined
- Check `project.json` for available targets

**"Circular dependency"**
- Use `nx graph` to visualize the cycle
- Refactor to break the dependency

---

## Best Practices for AI Agents

1. **Discover before acting**: Use `nx show projects` and `nx show project <name>` to understand available projects and targets

2. **Check affected first**: Before running tests on everything, use `nx affected -t test` to run only what's needed

3. **Understand the graph**: Use `nx graph` conceptually to understand project relationships

4. **Read project.json**: Check the project configuration to understand available targets and their options

5. **Clear cache when stuck**: If builds behave unexpectedly, `nx reset` often helps

6. **Use parallel execution**: Nx automatically parallelizes independent tasks - trust it

7. **Check for configurations**: Many targets have `production` or `ci` configurations with different behavior
