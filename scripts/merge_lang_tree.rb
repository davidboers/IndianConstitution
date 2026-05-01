
if Dir.getwd.end_with?('scripts')
  Dir.chdir('..')
end

module Scripts
  SOURCE_LANGUAGE = 'en' # English
  OTHER_LANGUAGES = ['hi']

  def self.merge
    require 'json'

    # Main dirs

    for lang in OTHER_LANGUAGES do
      langdir = "#{lang}/"
      unless File.exist?(langdir)
        Dir.mkdir(langdir)
      end

    end

    # Content files

    Dir.glob("#{SOURCE_LANGUAGE}/**/*") do |f|
      for lang in OTHER_LANGUAGES do
        translated = f.sub("#{SOURCE_LANGUAGE}/", "#{lang}/")
        
        q = translated
        ext = File.extname(translated)
        if ['.html', '.md', '.json'].include?(ext.downcase)
          q = q.sub(ext, '.{html,HTML,md,MD,json,JSON}')
        end

        unless Dir.glob(q).any?
          if File.file?(f)
            File.write(translated, File.read(f)) # Read in the English/Template version as a default

          elsif File.directory?(f)
            Dir.mkdir(translated)

          end
        end
      end
    end

    # Data files

    def self.get_trans_path(lang) = "_data/languages/#{lang}.json"
    def self.get_tree_path(lang) = "_data/tree/#{lang}.json"

    source_trans_path = get_trans_path(SOURCE_LANGUAGE)
    source_tree_path = get_tree_path(SOURCE_LANGUAGE)

    source_trans = JSON.parse(File.read(source_trans_path))
    source_tree = JSON.parse(File.read(source_tree_path))

    for lang in OTHER_LANGUAGES do
      trans_path = get_trans_path(lang)
      tree_path = get_tree_path(lang)

      if File.exist?(trans_path)
        trans = JSON.parse(File.read(trans_path))

        source_trans.each_key do |key|
          unless trans.key?(key)
            puts "Warning: #{trans_path} does not have a translation for the #{key} key."

          end
        end

      else
        puts "Warning: '#{lang}' needs a translation key at #{trans_path}."
        File.write(trans_path, JSON.dump(source_trans))

      end

      # Tree

      unless File.exist?(tree_path)
        puts "Warning: '#{lang}' needs a tree file at #{tree_path}."
        File.write(tree_path, JSON.dump(source_tree))

      end
    end
  end
end

if __FILE__ == $0
  Scripts.merge
end