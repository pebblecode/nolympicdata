# Nolympic Data

Utterly unofficial searchable API of olympic venues and events for the year formally known as MMXII, in the city formerly known as Londinium

## Development

To set up

    gem install bundler
    bundle install

To run (using the development procfile)

    rake server
    # open http://localhost:4000/

Connect to the pebblecode vpn (for http://nolympics.pebblecode.net/ to work)

## Staging

Deployed on [heroku](http://www.heroku.com/).

To setup deployment

1. Checkout the remote `staging` branch and track the changes `git checkout --track -b staging origin/staging`.
2. Add staging remote `git remote add staging git@heroku.com:datavis-staging.git`

To push to staging (assuming you have heroku access to deploy)

    rake shipit:staging

This is deployed to: http://datavis-staging.herokuapp.com/

### Details

Project was created with (shouldn't need to be done again, but here just for reference)

    heroku create datavis-staging --stack cedar --remote staging
    heroku config:add RACK_ENV=staging --app datavis-staging
    heroku config:add LOG_LEVEL=DEBUG --app datavis-staging

Initial setup of origin staging branch

    git push origin HEAD:refs/heads/staging

Merging code and pushing to staging branch

    git checkout staging; git merge master
    git push origin staging:staging

    # Or as a rake task
    rake merge_push_to:staging

To push to the staging server

    git push staging staging:master

    # Or as a rake task
    rake deploy:staging

    # Or as a merge, push and deploy rake task
    rake shipit:staging

## Sandbox

Used for temporary deployments to test things out. Deployed on [heroku](http://www.heroku.com/).

To setup deployment:

    git remote add sandbox git@heroku.com:datavis-sandbox.git

To push to sandbox (assuming you have heroku access to deploy)

    rake shipit:force_deploy[some_branch]
    # Where `some_branch` is the branch you want to deploy

To deploy the `design` branch to the sandbox, you can also do

    rake shipit:design_sandbox

This is deployed to: http://datavis-sandbox.herokuapp.com/

### Details

Project was created with (shouldn't need to be done again, but here just for reference)

    heroku create datavis-sandbox --stack cedar --remote sandbox
    heroku config:add RACK_ENV=staging --app datavis-sandbox
    heroku config:add LOG_LEVEL=DEBUG --app datavis-sandbox

## Production

Currently it is being hosted at `http://nolympics.pebblecode.net/`.

To deploy:

1. Copy the files in the `public` folder to production using ftp (find out details from someone). Update `script.js` with the corect `dataUrl` if need be.
2. Generate the html/css files using `./scripts/generate_html.rb` in the root directory of this project.
3. Copy the generated files to their respective places on production using ftp.