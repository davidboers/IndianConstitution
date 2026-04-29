
require 'pathname'

module Jekyll
  module ArticleNumber
    def article_num(dir)
      Pathname.new(dir).basename.to_s
    end

    def sort_articles(articles)
      articles.sort_by do |a| 
        num = article_num(a.dir)
        [num.to_i].concat(num.gsub(/\d+/, "").split(""))
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::ArticleNumber)