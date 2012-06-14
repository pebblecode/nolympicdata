#!/usr/bin/ruby
#
# Generate html from sinatra app.
#

require 'net/http'

uri = URI("http://127.0.0.1:4000")
port = 4000
output_dir = "tmp"

puts "Downloading from: #{uri}"

index_req = Net::HTTP::Get.new(uri.request_uri)
index_req.basic_auth 'datavis', 'datavis'

css_req = Net::HTTP::Get.new(uri.request_uri + "/css/style.css")

res = Net::HTTP.start(uri.host, uri.port) {|http|
	Dir.mkdir(output_dir) unless File::directory? output_dir

  index = http.request(index_req)
  open("#{output_dir}/index.html", "wb") { |file|
    file.write(index.body)
  }

  css = http.request(css_req)
  open("#{output_dir}/style.css", "wb") { |file|
    file.write(css.body)
  }
}

puts "Files downloaded to: #{output_dir}"