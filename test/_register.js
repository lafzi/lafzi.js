// test/_register.js:
require('@babel/register')({
	// These patterns are relative to the project directory (where the `package.json` file lives):
	ignore: ['node_modules/*', 'test/*']
});