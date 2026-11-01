// Test file for password validation and cleaning
// This can be run in the browser console

console.log('=== Testing Password Validation and Cleaning ===');

// Test function to clean passwords
const cleanPassword = (password) => {
  if (!password) return '';
  
  // إزالة المسافات من البداية والنهاية
  let cleaned = password.trim();
  
  // إزالة المسافات المتعددة
  cleaned = cleaned.replace(/\s+/g, '');
  
  // التحقق من أن كلمة المرور تحتوي على أحرف صالحة فقط
  const validPasswordRegex = /^[a-zA-Z0-9\u0600-\u06FF!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$/;
  
  if (!validPasswordRegex.test(cleaned)) {
    // إذا كانت تحتوي على أحرف غير صالحة، إزالتها
    cleaned = cleaned.replace(/[^a-zA-Z0-9\u0600-\u06FF!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/g, '');
  }
  
  return cleaned;
};

// Test cases
const testCases = [
  { input: '   ', expected: '', description: 'Empty spaces only' },
  { input: '  test  ', expected: 'test', description: 'Spaces around text' },
  { input: 'test  123', expected: 'test123', description: 'Multiple spaces between words' },
  { input: 'test@123', expected: 'test@123', description: 'Valid special characters' },
  { input: 'test#123', expected: 'test#123', description: 'Valid special characters' },
  { input: 'test$123', expected: 'test$123', description: 'Valid special characters' },
  { input: 'test%123', expected: 'test%123', description: 'Valid special characters' },
  { input: 'test^123', expected: 'test^123', description: 'Valid special characters' },
  { input: 'test&123', expected: 'test&123', description: 'Valid special characters' },
  { input: 'test*123', expected: 'test*123', description: 'Valid special characters' },
  { input: 'test(123)', expected: 'test(123)', description: 'Valid special characters' },
  { input: 'test_123', expected: 'test_123', description: 'Valid special characters' },
  { input: 'test+123', expected: 'test+123', description: 'Valid special characters' },
  { input: 'test-123', expected: 'test-123', description: 'Valid special characters' },
  { input: 'test[123]', expected: 'test[123]', description: 'Valid special characters' },
  { input: 'test{123}', expected: 'test{123}', description: 'Valid special characters' },
  { input: 'test|123', expected: 'test|123', description: 'Valid special characters' },
  { input: 'test;123', expected: 'test;123', description: 'Valid special characters' },
  { input: 'test:123', expected: 'test:123', description: 'Valid special characters' },
  { input: 'test,123', expected: 'test,123', description: 'Valid special characters' },
  { input: 'test.123', expected: 'test.123', description: 'Valid special characters' },
  { input: 'test<123>', expected: 'test<123>', description: 'Valid special characters' },
  { input: 'test?123', expected: 'test?123', description: 'Valid special characters' },
  { input: 'مرحبا123', expected: 'مرحبا123', description: 'Arabic text with numbers' },
  { input: 'hello123', expected: 'hello123', description: 'English text with numbers' },
  { input: 'test\n123', expected: 'test123', description: 'Newline character removed' },
  { input: 'test\t123', expected: 'test123', description: 'Tab character removed' },
  { input: 'test\r123', expected: 'test123', description: 'Carriage return removed' },
  { input: 'test\f123', expected: 'test123', description: 'Form feed removed' },
  { input: 'test\v123', expected: 'test123', description: 'Vertical tab removed' },
  { input: 'test\u0000123', expected: 'test123', description: 'Null character removed' },
  { input: 'test\u0001123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0002123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0003123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0004123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0005123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0006123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0007123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0008123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0009123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u000A123', expected: 'test123', description: 'Line feed removed' },
  { input: 'test\u000B123', expected: 'test123', description: 'Vertical tab removed' },
  { input: 'test\u000C123', expected: 'test123', description: 'Form feed removed' },
  { input: 'test\u000D123', expected: 'test123', description: 'Carriage return removed' },
  { input: 'test\u000E123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u000F123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0010123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0011123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0012123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0013123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0014123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0015123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0016123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0017123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0018123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u0019123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u001A123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u001B123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u001C123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u001D123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u001E123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u001F123', expected: 'test123', description: 'Control character removed' },
  { input: 'test\u007F123', expected: 'test123', description: 'Delete character removed' },
  { input: 'test\u0080123', expected: 'test123', description: 'Extended ASCII removed' },
  { input: 'test\u009F123', expected: 'test123', description: 'Extended ASCII removed' },
  { input: 'test\u00A0123', expected: 'test123', description: 'Non-breaking space removed' },
  { input: 'test\u00AD123', expected: 'test123', description: 'Soft hyphen removed' },
  { input: 'test\u200B123', expected: 'test123', description: 'Zero-width space removed' },
  { input: 'test\u200C123', expected: 'test123', description: 'Zero-width non-joiner removed' },
  { input: 'test\u200D123', expected: 'test123', description: 'Zero-width joiner removed' },
  { input: 'test\u200E123', expected: 'test123', description: 'Left-to-right mark removed' },
  { input: 'test\u200F123', expected: 'test123', description: 'Right-to-left mark removed' },
  { input: 'test\u2028123', expected: 'test123', description: 'Line separator removed' },
  { input: 'test\u2029123', expected: 'test123', description: 'Paragraph separator removed' },
  { input: 'test\u202F123', expected: 'test123', description: 'Narrow no-break space removed' },
  { input: 'test\u205F123', expected: 'test123', description: 'Medium mathematical space removed' },
  { input: 'test\u2060123', expected: 'test123', description: 'Word joiner removed' },
  { input: 'test\u2061123', expected: 'test123', description: 'Function application removed' },
  { input: 'test\u2062123', expected: 'test123', description: 'Invisible times removed' },
  { input: 'test\u2063123', expected: 'test123', description: 'Invisible separator removed' },
  { input: 'test\u2064123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u2065123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u2066123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u2067123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u2068123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u2069123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u206A123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u206B123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u206C123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u206D123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u206E123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\u206F123', expected: 'test123', description: 'Invisible plus removed' },
  { input: 'test\uFEFF123', expected: 'test123', description: 'Byte order mark removed' },
  { input: 'test\uFFFE123', expected: 'test123', description: 'Byte order mark removed' },
  { input: 'test\uFFFF123', expected: 'test123', description: 'Byte order mark removed' },
];

console.log('\n=== Running Password Cleaning Tests ===');
let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  const result = cleanPassword(testCase.input);
  const passed = result === testCase.expected;
  
  if (passed) {
    passedTests++;
    console.log(`✓ Test ${index + 1}: ${testCase.description}`);
  } else {
    failedTests++;
    console.log(`✗ Test ${index + 1}: ${testCase.description}`);
    console.log(`  Input: "${testCase.input}"`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got: "${result}"`);
  }
});

console.log(`\n=== Test Results ===`);
console.log(`Passed: ${passedTests}`);
console.log(`Failed: ${failedTests}`);
console.log(`Total: ${testCases.length}`);

console.log('\n=== Test Instructions ===');
console.log('1. Go to Admin Dashboard > Employees');
console.log('2. Add a new employee with password containing spaces or special characters');
console.log('3. Try to login with the same password in Cashier Dashboard');
console.log('4. Verify that login works correctly');

console.log('\n=== Expected Behavior ===');
console.log('✓ Passwords with spaces are cleaned automatically');
console.log('✓ Only valid characters are accepted');
console.log('✓ Login works consistently between admin and cashier panels');
console.log('✓ Invalid characters are removed automatically');
