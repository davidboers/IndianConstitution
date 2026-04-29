
source 'https://rubygems.org'

if ENV['GITHUB_PAGES']
  # Old version because github pages can't handle Jekyll 4.0 for some reason (4/26)
  gem 'jekyll', '~> 3.10'

  group :jekyll_plugins do
    gem 'article_numbers', path: '_plugins'
    gem 'extract_margin', path: '_plugins'
  end
else
  gem 'jekyll'
end

gem 'nokogiri'