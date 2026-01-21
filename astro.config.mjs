// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
	site: 'https://entering.theworkpc.com',
	base: '/wiki/',
	integrations: [
		starlight({
			title: "A Nerd's Notebook",
			social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/binder-badge/binder-badge.github.io' }],
			sidebar: [
				{
					label: 'Guides',
					autogenerate: { directory: 'guides' }						
				},
				{
					label: 'Headscale',
					autogenerate: { directory: 'headscale' }						
				},
				{
					label: 'Homelab',
					autogenerate: { directory: 'homelab' }						
				},
				{
					label: 'Random Shinanegans',
					autogenerate: { directory: 'shinanegans' }						
				},
			],
		}),
	],
});
