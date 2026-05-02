
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

    def next_article(list, article)
      return nil if list.empty?

      i = list.map(&:path).index(article['path'])
      next_i = i + 1

      unless next_i == list.size
        list[next_i]

      end
    end

    def prev_article(list, article)
      return nil if list.empty?
      
      i = list.map(&:path).index(article['path'])
      prev_i = i - 1

      unless prev_i == -1
        list[prev_i]

      end      
    end
  end
end

Liquid::Template.register_filter(Jekyll::ArticleNumber)