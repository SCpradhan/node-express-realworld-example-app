# Repository Metadata Knowledge Base

## `.vscode`
| File Path | Core Purpose | Exposed Functions |
|-----------|--------------|-------------------|
| `.vscode/extensions.json` | This is a Visual Studio Code workspace configuration file that specifies recommended extensions for developers working on this Node.js Express RealWorld example application. It suggests four extensions: Angular Console, Prettier for code formatting, Jest test runner, and ESLint for code linting. |  |

## `/`
| File Path | Core Purpose | Exposed Functions |
|-----------|--------------|-------------------|
| `.eslintrc.json` | Defines ESLint configuration for a monorepo managed by Nx, establishing linting rules and overrides for TypeScript, JavaScript, and test files. Configures the root-level linting behavior with Nx-specific plugins and file pattern matching to enforce code quality standards across the project. |  |
| `jest.config.ts` | Configures Jest testing framework settings for the API module of a Node.js Express application. Defines test environment, file transformation rules using ts-jest for TypeScript files, test file matching patterns, and coverage output directory. |  |

## `e2e`
| File Path | Core Purpose | Exposed Functions |
|-----------|--------------|-------------------|
| `e2e/.eslintrc.json` | Defines ESLint configuration for the e2e testing directory in an Nx monorepo workspace. Specifies linting rules and plugins for TypeScript and JavaScript files, ensuring code quality standards are enforced across end-to-end test files. |  |
| `e2e/jest.config.ts` | Configures Jest testing framework for end-to-end (e2e) tests in a Node.js/TypeScript environment. Defines test environment settings, TypeScript transformation rules, global setup/teardown hooks, and coverage output directory for the e2e test suite. |  |
| `e2e/project.json` | Defines the Nx workspace project configuration for the end-to-end testing suite. Specifies build targets for running Jest-based e2e tests and ESLint validation, with an implicit dependency on the 'api' project to ensure proper test execution order. |  |
| `e2e/tsconfig.json` | TypeScript configuration file for the end-to-end (e2e) testing directory. Extends the root tsconfig.json and references a specialized spec configuration file for test execution. Enables ES module interoperability for the e2e test suite. |  |
| `e2e/tsconfig.spec.json` | TypeScript configuration file specifically for end-to-end test specifications in a Node.js Express application. Extends the base TypeScript configuration and configures the compiler to output CommonJS modules with Jest and Node type definitions for the e2e testing environment. |  |

## `e2e/src/server`
| File Path | Core Purpose | Exposed Functions |
|-----------|--------------|-------------------|
| `e2e/src/server/server.spec.ts` | This is an end-to-end test specification file that validates the server's root endpoint behavior. It contains a single test suite that verifies the GET request to the root path returns a 200 status code and the expected JSON message response. |  |

## `e2e/src/support`
| File Path | Core Purpose | Exposed Functions |
|-----------|--------------|-------------------|
| `e2e/src/support/global-setup.ts` | Provides global setup configuration for end-to-end testing infrastructure. This module exports an async function that initializes test environment prerequisites and passes teardown messages to the global teardown phase via globalThis. | <b>`module.exports = async function ()`</b>: Executes global setup tasks before test suite runs and configures the teardown message that will be used during cleanup phase. |
| `e2e/src/support/global-teardown.ts` | Serves as the global teardown hook for end-to-end test execution in the node-express-realworld-example-app. This module is invoked after all tests complete to perform cleanup operations such as stopping services or docker-compose containers, and logs a teardown message stored in the global context. | <b>`module.exports = async function ()`</b>: Executes cleanup logic after all e2e tests complete, including stopping services and logging the teardown message from globalThis. |
| `e2e/src/support/test-setup.ts` | Configures the global axios HTTP client for end-to-end test execution. Sets the base URL for API requests by reading host and port from environment variables or using localhost:3000 as defaults. | <b>`module.exports = async function ()`</b>: Asynchronous setup function that configures axios defaults with the appropriate base URL for the test environment. |

