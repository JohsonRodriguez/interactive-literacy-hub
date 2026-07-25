-- Keep stored activity destinations aligned with the extensionless GitHub Pages routes.
update public.activities
set page_url = replace(page_url, '.html', '/')
where page_url like '%.html%';
