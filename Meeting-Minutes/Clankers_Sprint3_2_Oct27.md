# Meeting Minutes - October 27, 2025

## Attendees
- Jonah Dorant
- Yi Fu Li
- Kelvin Luong
- Abhishek Thakur
- Jia Cheng Wang
- Anthony Wilson
- Clarence Zhen

## Goals
- Getting a clear global idea of where we are at in this current sprint
- Discuss and reiterate on how integration will be made
- Cleaning up the repo branches and issues

## Discussion Points
### General
- Ideally, we should have gotten to have integrate both the frontend and the backend by now
  - However, learning to utilize `sdk.gen.ts` will take some time - we hope to have some sort of integration test done by Wednesday and a full integration by the end of the Sprint
- Cleaning up surplus/deprecated branches on the repo:
  - Require clear communication during PR to avoid confusion since not everybody is working at the same time (Looking at the frontend PRs)
- Closing up issues that were not closed due to PRs not going through even though there were some manual drop-in files
- Closing up most issues that mention `axios` due to it being mostly taken care of by `openapi-ts`

## Actions & Decisions
*Feel free to add more things to be done and translate them into issues*
### Frontend
- Reviews and utilizing the `sdk.gen.ts` file still needs to be done
- Changing the colorscheme
- Adding responsive design if we have the time
- Managing the OAuth Token for authorization
- Focus on polishing and integration before the end of the sprint

### Backend
- Reviews table needs to be done (Models)
- Tickets table/csv needs to be implemented as a user property (Models)
- Adding event analytics and all events models as REST APIs
- Adding platform oversight functions (such as traffic and counts)
- Adding user create API for registration

### Validation
1. Remove the workflow file on the `main` branch and add it into a fork of `backend`
2. Make it so that when we successfully merge from another branch to the `backend`, the `yaml` script runs:
```yaml
# near the beginning of the script
on:
  pull_request:
    types:
      - closed
    branches: ["backend", "add-your-test-branch-if-youre-testing"]
# continue with your yaml setup like permissions and jobs
```
3. Using the `ubuntu-latest` runner (Hopefully, you already know how to do most of it:
  - Use the `setup-python` action
```yaml
# Your job setup
steps:
  - name: Checkout Git Repo
    uses: actions/checkout@v4
    # Test it out... idk if it will pull main or pull on the merged branch (make sure to test it)
  - name: Set Up Python
    uses: actions/setup-python@v5
    with:
      python-version: "3.17"    # this is the version you should be using
```
  - Enter the backend folder and activate the environment
```yaml
  # Once your done setting up heres how you setup the environment
  - name: Setup Py virtual enviornment and download requirements.txt
    run: |
      cd backend
      python -m venv .venv           # I know you did it without the virtual environment but
      source .venv/bin/activate      # I highly suggest doing virtual environments because it will be cleaner
      pip install -r requirements.txt# Also, I fixed the jwt error - You can remove it from your workflow. It will download pyjwt
```
  - Run this `fastapi dev` command in a seperate process, if it fails to run, then end the script
  - Use these credentials to login into the backend to get the OAuth token while the server is running in the background
```
Username: ClankAdmin@clank.com
Password: password
URL to send this request: http://localhost:8000/clank/login/access-token
```
  - PS: You will need to use `curl` and learn how to set up a request header to call it
  - Login, if it fails or gives you a different status number than 200 with the given credentials, fail the test
  - Logging into the backend give you an OAuth token, this token needs to be utilize on every `curl` call you make from here on out (and yes, its different every time you run fastapi)
  - Go through several other API calls and make sure that they give you the correct response (either a 200 or the ones described in the `openapi.json` file)
  - If that file is unreadable to you, you can run the backend on your own machine once to have a proper view of whats going on (if you dont know, dm me) 

> It will be a very tedious week. NGL. Time to lock in.
