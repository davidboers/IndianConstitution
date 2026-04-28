FROM ruby:3.3

WORKDIR /target
COPY Gemfile* .
RUN AS_TEST=true bundle install
COPY . .

#COPY en as
#COPY en bn
#COPY en gu
#COPY en hi
#COPY en kn
#COPY en ks
#COPY en ml
#COPY en mr
#COPY en ne
#COPY en or
#COPY en pa
#COPY en sd
#COPY en ta
#COPY en te
#COPY en ur

EXPOSE 4000
ENV AS_TEST="true"
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]