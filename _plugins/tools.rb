
module Jekyll
  module LangPages
    def filter_lang_pages(pages, lang)
      lang_dir = "/#{lang}/"
      pages.select { |page| page.dir.include?(lang_dir) }

    end

    def slug(url)
      File.basename(url, ".*")
      
    end
  end
end

Liquid::Template.register_filter(Jekyll::LangPages)