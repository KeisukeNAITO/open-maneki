import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	daisyui: {
		themes: [
			{
				'maneki-theme': {
					primary: '#f87171',
					secondary: '#fbbf24',
					accent: '#84cc16',
					neutral: '#374151',
					'base-100': '#f5f5f4',
					info: '#e0f2fe',
					success: '#bef264',
					warning: '#f59e0b',
					error: '#ff1c1c'
				}
			},
			'dark'
		]
	},

	plugins: [daisyui]
} satisfies Config;
