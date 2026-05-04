
module Jekyll
  module LangPages
    def filter_lang_pages(pages, lang)
      lang_dir = "/#{lang}/"
      pages.select { |page| page.dir.include?(lang_dir) }

    end

    def slug(url)
      File.basename(url, '.*')
      
    end

    def get_lang_url(path, lang, current_lang)
      unless path.include? "/#{current_lang}/"
        path = "/#{current_lang}#{path}"
      end

      path.sub("/#{current_lang}/", "/#{lang}/")

    end

    def filter_articles(pages)
      pages.filter { |page| page.name == 'index.html' }

    end
  end

  module Refs
    def filter_ref_entries(entries, path, lang)
      path = path.sub("#{lang}/", '').sub('index.html', '')
      groups = entries.filter { |group| group.any? { |link| link['path'] == path } }
      entries = groups.flatten.uniq
      entries.filter { |entry| !entry['path'].include?(path) }

    end

    def quick_jump_marker(marker, tp)
      if marker.nil?
        puts tp
      end

      marker.sub(tp, '').strip
    end
  end

  module StringFilter
    def endswith(text, query)
      text.end_with? query
    
    end
  end
end

Liquid::Template.register_filter(Jekyll::LangPages)
Liquid::Template.register_filter(Jekyll::Refs)
Liquid::Template.register_filter(Jekyll::StringFilter)