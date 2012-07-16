# encoding utf-8

require 'rubygems'
require 'sinatra'
require './lib/partials'
require 'haml'
require 'sass'
require 'compass'
require 'sinatra/assetpack'
require 'rdiscount'
require 'sinatra/content_for'

helpers Sinatra::Partials
require_relative 'helpers/init'
helpers Sinatra::ContentFor
# register Sinatra::AssetPack

set :root, File.dirname(__FILE__)
set :environment, ENV["RACK_ENV"] || "development"
set :blog_url, "http://blog.pebblecode.com"

configure do
  Compass.configuration do |config|
    config.project_path = File.dirname(__FILE__)
    config.sass_dir = 'views/stylesheets'
  end

  set :haml, { :format => :html5 }
  set :scss, Compass.sass_engine_options

  assets {
    serve '/javascripts', from: 'public/javascripts'
    # serve '/stylesheets', from: '/stylesheets'
    serve '/images', from: 'public/images'

    # The second parameter defines where the compressed version will be served.
    # (Note: that parameter is optional, AssetPack will figure it out.)
    js :lib, '/javascripts/script.js', [
      '/javascripts/lib/modernizr-2.5.3.js',
      '/javascripts/lib/underscore-min.js',
      '/javascripts/lib/slides.min.jquery.js',
      '/javascripts/lib/jquery.scrollTo-1.4.2-min.js'
    ]

    # css :app, '/stylesheets/screen.css', [
    #   '/stylesheets/screen.css',
    #   '/fonts/meta.css'
    # ]

    js_compression  :jsmin
    css_compression :sass
  }
end

get '/stylesheets/screen.css' do
  content_type 'text/css', :charset => 'utf-8'
  scss :'stylesheets/screen'
end

get '/' do
  protected! if settings.environment == "staging"

  "Temporary index page. Data vis is at: <a href='/olympic-data-vis'>olympic data visualisation</a>"
end

get '/thoughts' do
  protected! if settings.environment == "staging"

  if settings.environment == "development"
    # Tumblr blog styles
    erb :thoughts
  else
    # Actual tumblr blog
    redirect settings.blog_url
  end
end

############################################################
# Olympic data visualisation
############################################################

def protect_with_http_auth!
  protected!("datavis", "datavis")
end

get '/stylesheets/olympic-data-vis.css' do
  content_type 'text/css', :charset => 'utf-8'
  scss :'stylesheets/olympic-data-vis'
end

get '/olympic-data-vis' do
  protect_with_http_auth!

  @page_name = "olympic-data-vis"
  haml :"olympic-data-vis", :layout => :'layouts/application'
end

# Get an arbitrary path
get '/get' do
  url_path = params["url"]
  return "Error" if url_path.empty?

  uri = URI.parse(url_path)
  response = Net::HTTP.get_response uri

  response.body
end

############################################################

get '/:page' do
  protected! if settings.environment == "staging"

  @page_name = params['page']
  haml "#{@page_name}".to_sym, :layout => :'layouts/application'
end

error do
  @page_name = "404"
  haml "404".to_sym, :layout => :'layouts/application'
end
