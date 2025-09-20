# Testing Guide for Castrole Authentication

This document provides instructions for running and extending the unit tests for the authentication components in the Castrole application.

## Test Coverage

The following components have unit tests:

1. **AuthService** - Tests for authentication methods including:
   - Email/password registration and login
   - Google authentication
   - Apple authentication
   - User profile management

2. **LoginComponent** - Tests for:
   - Form validation
   - Email/password login
   - Social login (Google, Apple)
   - Error handling
   - Loading state

3. **ActorOnboardComponent** - Tests for:
   - Form validation
   - Location search functionality
   - Registration process
   - Social account linking
   - Error handling

4. **ProducerOnboardComponent** - Tests for:
   - Form validation
   - Location search functionality
   - Registration process
   - Social account linking
   - Error handling
   - OTP verification

## Running the Tests

### Running All Tests

To run all tests in the project:

```bash
npm test
```

This will execute the Angular test runner (Karma) and open a browser window showing the test results.

### Running Specific Tests

To run tests for a specific component or service:

```bash
npm test -- --include=src/app/services/auth.service.spec.ts
```

Replace the path with the specific test file you want to run.

### Running Tests with Code Coverage

To generate a code coverage report:

```bash
npm test -- --code-coverage
```

After running this command, a coverage report will be generated in the `coverage/` directory. Open `coverage/index.html` in a browser to view the detailed report.

## Test Structure

Each test file follows the Arrange-Act-Assert pattern:

1. **Arrange**: Set up the test environment, including mocks and test data
2. **Act**: Execute the code being tested
3. **Assert**: Verify the results

### Mocking Dependencies

The tests use Jasmine spies to mock dependencies:

- Firebase Auth services
- Firestore services
- HTTP requests
- Router navigation

## Extending the Tests

### Adding New Test Cases

To add new test cases:

1. Identify the functionality to test
2. Create a new `it()` block in the appropriate spec file
3. Follow the Arrange-Act-Assert pattern
4. Run the tests to verify

### Testing Firebase Authentication

When testing Firebase authentication:

1. Mock the Auth service and its methods
2. Create spy objects for User and UserCredential
3. Use `resolveTo()` and `rejectWith()` to simulate successful and failed authentication

Example:

```typescript
// Mock successful authentication
authServiceSpy.signInWithEmail.and.resolveTo(mockUser);

// Mock failed authentication
authServiceSpy.signInWithEmail.and.rejectWith(new Error('Invalid credentials'));
```

### Testing Asynchronous Code

Use `fakeAsync` and `tick()` to test asynchronous code:

```typescript
it('should do something asynchronous', fakeAsync(() => {
  // Arrange
  component.someProperty = 'value';
  
  // Act
  component.asyncMethod();
  tick(); // Simulate passage of time
  
  // Assert
  expect(component.result).toBe('expected value');
}));
```

## Troubleshooting Common Issues

### Tests Failing Due to Missing Providers

If tests fail with errors about missing providers, ensure all dependencies are properly mocked in the `TestBed.configureTestingModule()` setup.

### Asynchronous Test Timeouts

If asynchronous tests time out, make sure you're using `fakeAsync` and `tick()` correctly, or consider increasing the test timeout in the Karma configuration.

### HTTP Request Issues

For components that make HTTP requests, use `HttpTestingController` to mock responses:

```typescript
const req = httpMock.expectOne('/api/endpoint');
req.flush(mockResponseData);
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on the state from other tests
2. **Mock External Dependencies**: Always mock external services like Firebase
3. **Test Error Scenarios**: Include tests for error handling and edge cases
4. **Keep Tests Focused**: Each test should verify a single behavior
5. **Maintain Test Coverage**: Aim for high test coverage, especially for critical authentication flows
