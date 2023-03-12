-- CreateTable
CREATE TABLE "users" (
    "user_id" SERIAL NOT NULL,
    "display_name" TEXT NOT NULL,
    "creation_date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "password" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "msg_id" SERIAL NOT NULL,
    "posted_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "msg_content" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chatroom_id" INTEGER NOT NULL,
    "isimage" BOOLEAN NOT NULL DEFAULT false,
    "isfile" BOOLEAN NOT NULL DEFAULT false,
    "file_uuid" TEXT NOT NULL DEFAULT E'',

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("msg_id")
);

-- CreateTable
CREATE TABLE "chatrooms" (
    "chatroom_id" SERIAL NOT NULL,
    "name" TEXT,
    "isgroup" BOOLEAN NOT NULL,
    "created_by" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatrooms_pkey" PRIMARY KEY ("chatroom_id")
);

-- CreateTable
CREATE TABLE "participants" (
    "p_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chatroom_id" INTEGER NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("p_id")
);

-- CreateTable
CREATE TABLE "settings" (
    "settings_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "filter" TEXT NOT NULL DEFAULT E'filter',
    "font_size" TEXT NOT NULL DEFAULT E'default',
    "embed_yt_videos" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("settings_id")
);

-- CreateTable
CREATE TABLE "emote" (
    "emote_id" SERIAL NOT NULL,
    "emote" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "emote_pkey" PRIMARY KEY ("emote_id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "reactions_id" SERIAL NOT NULL,
    "msg_id" INTEGER NOT NULL,
    "emote_id" INTEGER NOT NULL,
    "user_id" INTEGER,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("reactions_id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "notification_id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "chatroom_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "originated_from" INTEGER NOT NULL,
    "date" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("notification_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "display_name_unique" ON "users"("display_name");

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chatroom_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("chatroom_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "chatroom_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("chatroom_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "settings" ADD CONSTRAINT "user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "msg_id_fk" FOREIGN KEY ("msg_id") REFERENCES "chat_messages"("msg_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "emote_id_fk" FOREIGN KEY ("emote_id") REFERENCES "emote"("emote_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "originated_from_fk" FOREIGN KEY ("originated_from") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "user_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "chatroom_id_fk" FOREIGN KEY ("chatroom_id") REFERENCES "chatrooms"("chatroom_id") ON DELETE NO ACTION ON UPDATE NO ACTION;
