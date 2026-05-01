FROM ruby:3.3

WORKDIR /target
COPY Gemfile* .
RUN bundle install
COPY . .

RUN ruby scripts/merge_lang_tree.rb

EXPOSE 4000
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]