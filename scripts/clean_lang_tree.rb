require_relative 'merge_lang_tree'

# Removes all files in any language dir ('hi/', 'bn/', etc.) other than 'en/' that is the same as the 'en/' counterpart. 
# No file removed by this script should be pushed to GitHub.

module Scripts
  def self.clean

    for lang in OTHER_LANGUAGES do
      if lang == SOURCE_LANGUAGE
        next # Fail safe to prevent file deletion in source dir.

      end

      count = 0

      Dir.glob("#{lang}/**/*") do |f|

        if File.file?(f)
          contents = File.read(f).strip

          ext = File.extname(f)
          dir = File.dirname(f)
          basename = File.basename(f)

          extensions = ['.html', '.md', '.json'].unshift(ext).uniq # Move the extension of the given file to the front of the list
          
          found = false
          for ext_altern in extensions
            src_path = f.sub("/#{lang}/", "/#{SOURCE_LANGUAGE}/").sub(ext, ext_altern)

            if File.exist?(src_path)
              if File.read(src_path).strip == contents
                File.delete(f)
                count += 1

              end
              found = true
              break

            end
          end

          unless found
            puts "Warning: No equivalent of #{f} in source directory."
          end

        end
      end

      if count > 0
        puts "Deleted #{count} files in #{lang}/."

      end

    end # Lang loop
  end
end

if __FILE__ == $0
  Scripts.clean
end