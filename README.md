# Chatty

frontend coverage: [![frontend codecov](https://codecov.io/gh/sixP-NaraKa/chatty/graph/badge.svg?token=P5QF2BPNTK)](https://codecov.io/gh/sixP-NaraKa/chatty)

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 13.3.7.

## Disclaimer

Chat web application (intended for private/local use).

This application is more of a "proof of concept", due to it being the first time for me using TypeScript + Angular, Prisma and NestJS.

Many "do's and don'ts" have been learned during the course of this project, so expect still bugs and less-than-optimal solutions and implementations and general jankiness. :smile:

All in all, this project was fun to implement!

## Features

Here are the things "chatty" can do:

-   User registering and login
-   1 on 1 chats
    -   message reactions
    -   emotes
    -   URL highlighting
    -   copy-paste images
    -   display images from URLs (jpg, jpeg, png, gif, tiff, bmp)
    -   pagination via infinite scrolling
    -   file sharing/uploading via drag-and-drop into a chat
    -   embed YouTube videos if setting enabled (placed at the end of messages)
-   Group chats
    -   adding and removing people
-   1 on 1 voice chats (via WebSockets)
-   notifications (e.g. missed messages, reactions or calls)
-   mobile-friendly layout (on smaller screen sizes)
-   ...

### Possibly upcoming

-   group voice chats (not sure if the current implementation would support this to some degree already)

## Development server

Run `npm run serve` for a dev server. Navigate to `http://localhost:4300/`. The application will automatically reload if you change any of the source files.

## Running it locally

The application is configured to use https (frontend and backend - using self-signed certificates) in the `frontend` and `backend` directories respectively.

### Frontend:

`ng serve --host IP --port PORT --ssl true --ssl-key chatty-server-key.pem --ssl-cert chatty-server-cert.pem`

See also in `frontend/src` > `package.json` > `npm run sas`.

File: [package.json](https://github.com/sixP-NaraKa/chatty/blob/main/frontend/package.json).

Additionally, within the `src/environments` directory a `config.ts` file is present, which exports a property called `BACKEND_HOST`. This `BACKEND_HOST` property needs to be adjusted to your needs.

### Backend:

A `.env` file with a `JWT_SECRET` property is required for authentication via JWT.

The `src/backend` is expecting the self-signed certificates per default, see `backend/src/main.ts`.
If this is not wanted, simply remove the affecting lines of code.

File: [main.ts](https://github.com/sixP-NaraKa/chatty/blob/main/backend/src/main.ts).

### Database

A `.env` file with a `DATABASE_URL` property is required for the usage of Prisma. This `.env` file should reside in the root directory of the application.

chatty uses the database tables mentioned in the [schema.prisma](https://github.com/sixP-NaraKa/chatty/blob/main/backend/prisma/schema.prisma) file.

The schema leaves quite a bit to be desired (:D), but it functions as needed.

## Screenshots

In the following a couple of screenshots on how chatty looks like:

Login

![login](/docs/screenshots/chatty_login.PNG)

Register

![register](/docs/screenshots/chatty_register.PNG)

Homescreen

![homescreen](/docs/screenshots/chatty_homescreen.PNG)

Notifications and Calls "menus"

![menus](/docs/screenshots/chatty_notifications_and_calls.PNG)

Example chat

![example chat](/docs/screenshots/chatty_example_chat.PNG)

Mobile-friendly layout example

![mobile-friendly layout example](/docs/screenshots/chatty_mobile_view.PNG)
