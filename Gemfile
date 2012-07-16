source :rubyforge
gem 'rake'
gem 'sinatra'
gem 'thin'
gem 'sinatra-flash'
gem 'rack'

# Asset packaging
gem 'sinatra-assetpack', :require => 'sinatra/assetpack'
gem 'sinatra-contrib'

# Views
gem 'sass'
gem 'haml'
gem "compass"
gem 'rdiscount'  # For markdown usage

# For production deployment
gem 'heroku'

# For running on production
gem 'rspec'

group :development, :test do
  # Servers
  gem 'shotgun'
  gem 'ruby-debug19', :require => 'ruby-debug'

  # Testing
  gem 'guard'
  gem 'foreman'
  gem 'rb-inotify', :require => false
  gem 'rb-fsevent', :require => false
  gem 'rb-fchange', :require => false
  gem 'guard-rspec'

  gem 'rack-test'
  gem "factory_girl", "~> 2.1.0"
  gem 'capybara'
end

