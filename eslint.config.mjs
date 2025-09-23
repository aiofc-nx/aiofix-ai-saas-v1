import nx from '@nx/eslint-plugin';

export default [
	...nx.configs['flat/base'],
	...nx.configs['flat/typescript'],
	...nx.configs['flat/javascript'],
	{
		// 忽略构建输出目录
		ignores: ['**/dist']
	},
	{
		files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
		rules: {
			// Nx 工作区模块边界规则
			'@nx/enforce-module-boundaries': [
				'error',
				{
					enforceBuildableLibDependency: true,
					allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
					depConstraints: [
						{
							sourceTag: '*',
							onlyDependOnLibsWithTags: ['*']
						}
					]
				}
			]
		}
	},
	{
		files: ['**/*.ts', '**/*.tsx'],
		rules: {
			// 代码风格规则 (从 TSLint 迁移)
			'@typescript-eslint/prefer-function-type': 'error', // 优先使用函数类型 (callable-types)
			'@typescript-eslint/naming-convention': [
				'error',
				{
					selector: 'class',
					format: ['PascalCase'] // 类名使用 PascalCase (class-name)
				}
			],
			'@typescript-eslint/prefer-for-of': 'error', // 优先使用 for-of 循环 (forin)
			'@typescript-eslint/consistent-type-definitions': ['error', 'interface'], // 优先使用接口 (interface-over-type-literal)
			'@typescript-eslint/member-ordering': [
				'error',
				{
					// 类成员排序规则 (member-ordering)
					default: ['static-field', 'instance-field', 'static-method', 'instance-method']
				}
			],
			'@typescript-eslint/member-ordering': 'off',

			// 功能性规则
			'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-caller': 'error', // 禁用 arguments.callee (no-arg)
			'no-bitwise': 'error', // 禁用位运算符 (no-bitwise)
			'no-console': ['error', { allow: ['warn', 'error'] }], // 限制 console 使用 (no-console)
			'no-new-wrappers': 'error', // 禁用包装器构造函数 (no-construct)
			'no-debugger': 'error', // 禁用 debugger (no-debugger)
			'@typescript-eslint/no-empty-interface': 'error', // 禁用空接口 (no-empty-interface)
			'no-eval': 'error', // 禁用 eval (no-eval)
			'@typescript-eslint/no-inferrable-types': [
				'error',
				{ ignoreParameters: true } // 禁用可推断类型，但忽略参数 (no-inferrable-types)
			],
			'@typescript-eslint/no-misused-new': 'error', // 禁用错误的 new 使用 (no-misused-new)
			'@typescript-eslint/no-non-null-assertion': 'error', // 禁用非空断言 (no-non-null-assertion)
			'no-shadow': 'off',
			'@typescript-eslint/no-shadow': 'error', // 禁用变量遮蔽 (no-shadowed-variable)
			'dot-notation': 'off',
			'@typescript-eslint/dot-notation': 'off', // 允许字符串字面量属性访问 (no-string-literal: false)
			'no-throw-literal': 'error', // 禁用抛出字符串字面量 (no-string-throw)
			'no-fallthrough': 'error', // 禁用 switch case 穿透 (no-switch-case-fall-through)
			'@typescript-eslint/no-unused-expressions': 'error', // 禁用未使用表达式 (no-unused-expression)
			'no-var': 'error', // 禁用 var (no-var-keyword)
			'prefer-const': 'error', // 优先使用 const (prefer-const)
			radix: 'error', // parseInt 指定进制 (radix)
			eqeqeq: ['error', 'always', { null: 'ignore' }], // 强制 === 但允许 null 检查 (triple-equals)
			'@typescript-eslint/unified-signatures': 'error', // 统一重载签名 (unified-signatures)

			// TypeScript 特定规则
			'@typescript-eslint/explicit-member-accessibility': 'off', // 不强制成员访问修饰符 (member-access: false)
			'@typescript-eslint/no-empty': 'off' // 允许空代码块 (no-empty: false)
		}
	},
	{
		files: ['**/*.js', '**/*.jsx', '**/*.cjs', '**/*.mjs'],
		rules: {
			// JavaScript 文件的通用规则
			'no-caller': 'error',
			'no-bitwise': 'error',
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'no-debugger': 'error',
			'no-eval': 'error',
			'no-shadow': 'error',
			'no-throw-literal': 'error',
			'no-fallthrough': 'error',
			'no-unused-expressions': 'error',
			'no-var': 'error',
			'prefer-const': 'error',
			radix: 'error',
			eqeqeq: ['error', 'always', { null: 'ignore' }]
		}
	},
	{
		files: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.js', '**/*.test.js'],
		rules: {
			// 测试文件的宽松规则
			'@typescript-eslint/no-explicit-any': 'off', // 允许使用 any 类型
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // 未使用变量改为警告
			'no-console': 'off', // 允许在测试中使用 console
			'@typescript-eslint/no-empty-function': 'off', // 允许空函数
			'@typescript-eslint/no-non-null-assertion': 'off', // 允许非空断言
			'prefer-const': 'warn', // const 改为警告
			'no-bitwise': 'off', // 允许位运算
			'@typescript-eslint/ban-ts-comment': 'off', // 允许 @ts-ignore 等注释
			'@typescript-eslint/no-empty': 'off', // 允许空代码块
			'@typescript-eslint/no-inferrable-types': 'off', // 允许可推断类型
			'@typescript-eslint/no-unsafe-assignment': 'off', // 允许不安全的赋值
			'@typescript-eslint/no-unsafe-member-access': 'off', // 允许不安全的成员访问
			'@typescript-eslint/no-unsafe-call': 'off', // 允许不安全的函数调用
			'@typescript-eslint/no-unsafe-return': 'off', // 允许不安全的返回值
			'@typescript-eslint/no-unsafe-argument': 'off', // 允许不安全的参数传递
			'@typescript-eslint/restrict-template-expressions': 'off', // 允许模板表达式中的任意类型
			'@typescript-eslint/restrict-plus-operands': 'off', // 允许加号操作符的任意类型
			'@typescript-eslint/no-floating-promises': 'off', // 允许未处理的Promise
			'@typescript-eslint/require-await': 'off', // 不要求async函数必须有await
			'@typescript-eslint/no-misused-promises': 'off', // 允许Promise的误用
			'@typescript-eslint/prefer-promise-reject-errors': 'off', // 允许Promise.reject任意值
			'@typescript-eslint/no-unnecessary-type-assertion': 'off', // 允许不必要的类型断言
			'@typescript-eslint/no-var-requires': 'off', // 允许require语句
			'@typescript-eslint/ban-types': 'off', // 允许使用被禁止的类型
			'@typescript-eslint/no-explicit-any': 'off', // 允许使用any类型
			'@typescript-eslint/no-unsafe-assignment': 'off', // 允许不安全的赋值
			'@typescript-eslint/no-unsafe-member-access': 'off', // 允许不安全的成员访问
			'@typescript-eslint/no-unsafe-call': 'off', // 允许不安全的函数调用
			'@typescript-eslint/no-unsafe-return': 'off', // 允许不安全的返回值
			'@typescript-eslint/no-unsafe-argument': 'off', // 允许不安全的参数传递
			'@typescript-eslint/restrict-template-expressions': 'off', // 允许模板表达式中的任意类型
			'@typescript-eslint/restrict-plus-operands': 'off', // 允许加号操作符的任意类型
			'@typescript-eslint/no-floating-promises': 'off', // 允许未处理的Promise
			'@typescript-eslint/require-await': 'off', // 不要求async函数必须有await
			'@typescript-eslint/no-misused-promises': 'off', // 允许Promise的误用
			'@typescript-eslint/prefer-promise-reject-errors': 'off', // 允许Promise.reject任意值
			'@typescript-eslint/no-unnecessary-type-assertion': 'off', // 允许不必要的类型断言
			'@typescript-eslint/no-var-requires': 'off', // 允许require语句
			'@typescript-eslint/ban-types': 'off' // 允许使用被禁止的类型
		}
	}
];
