require "nokogiri"

module Jekyll
  module MarginFilter
    def margin_text(article, num = nil)
      site = @context.registers[:site]

      # Because Jekyll can sometimes be finicky when trying to access .content
      path = article["path"]
      article = site.pages.find { |p| p.path == path }

      html = article.renderer.run

      extract_margin_text(html, article.url, num)
    end

    private

    def extract_margin_text(html, article = "", num)
      doc = Nokogiri::HTML.fragment(html)

      art = doc.at_css(".art")
      return "<i>No margin</i>" unless art

      margin_text = normalize_margin(art).sub(/—$/, "")

      if article&.include?("Schedules/")
        subtitle = doc.at_css("#subtitle")
        margin_text = "#{margin_text}—#{normalize_margin(subtitle)}" if subtitle
      elsif num
        margin_text = margin_text.sub("#{num}. ", "")
      end

      margin_text
    end

    def normalize_margin(node)
      clone = node.dup
      clone.children.each { |child| child.remove if child.element? }

      unless clone.inner_text.strip.empty?
        node.css("del, .del").remove
        
      end

      node.inner_text
    end
  end
end

Liquid::Template.register_filter(Jekyll::MarginFilter)