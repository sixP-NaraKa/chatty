import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Emote, ChatMessageWithUser, MessageReaction, Settings } from '../../../../shared/types/db-dtos';
import { ApplicationUser } from '../auth/auth.service';
import { UserService } from '../services/user.services';
import { WebsocketService } from '../services/websocket.service';
import { UserSettingsService } from '../services/user-settings.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-chat',
    templateUrl: './chat.component.html',
    styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements OnInit {
    currentUser: ApplicationUser;

    chatroomId: number = -1;
    @Input() set setChatroom(chatroomId: number) {
        this.chatroomId = chatroomId;
        // re-autofocus the message input box upon chat loads
        // revisit once the overall HTML structure has been reworked/restructured
        const input = document.getElementById('messageInput') as HTMLInputElement;
        if (input !== null) {
            input.focus();
        }
        this.displayChat(this.chatroomId);
    }

    chatroomMessages = new Array<ChatMessageWithUser>();
    cursor: number = -1;

    preSelectedEmotes: Emote[] = [
        {
            emote_id: 1,
            emote: '😁',
            name: 'beaming face with smiling eyes',
        },
        {
            emote_id: 189,
            emote: '👍',
            name: 'thumbs up',
        },
        {
            emote_id: 141,
            emote: '❤',
            name: 'red heart',
        },
        {
            emote_id: 75,
            emote: '😟',
            name: 'worried face',
        },
        {
            emote_id: 100,
            emote: '😡',
            name: 'pouting face',
        },
    ];

    embedYouTubeVideos: boolean | undefined = undefined;

    constructor(
        private userService: UserService,
        private wsService: WebsocketService,
        private settingsService: UserSettingsService,
        private toastrService: ToastrService
    ) {
        this.currentUser = this.userService.currentUser;
    }

    ngOnInit(): void {
        // get incoming messages from the joined chatrooms of the user
        // since we are leaving / joining the current room, we will also only care about this specific rooms
        // messages, other messages are handled by the parent app-chat-page component
        // Note / TODO: it should be possible to only listen to the current chatrooms messages, right? no need to do this anymore
        //              e.g.: new wsService.getChatMessageFromRoom(chatroomId)
        //              then we can simply create a setter for the incoming chatroom id, and then only fetch from that chatroom
        this.wsService.getChatMessage().subscribe((msg) => {
            if (msg.chatroom_id === this.chatroomId) {
                this.chatroomMessages.push(msg);
                this.scrollToLatestMessage();
            }
        });

        this.wsService.getNewEmoteReaction().subscribe(([chatroomId, messageId, userId, reaction]) => {
            if (chatroomId === this.chatroomId) {
                this.addEmoteReactionToMessage(reaction);
            }
        });

        this.wsService.getDeleteChatMessage().subscribe(([messageId, chatroomId]) => {
            if (chatroomId === this.chatroomId) {
                this.deleteFromMessagesById(messageId);
            }
        });

        this.settingsService.currentUserSettingsSubject$.subscribe((stts) => {
            this.applyFontSizeSettings(stts);
            this.embedYouTubeVideoSettings(stts);
        });
    }

    applyFontSizeSettings(usrSetts: Settings) {
        let chatWindowElement = document.getElementById('chatWindowDiv') as HTMLDivElement;
        if (usrSetts.font_size === 'default') {
            chatWindowElement.classList.add('text-xs', 'md:text-base');
            chatWindowElement.classList.remove('text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl');
        } else {
            chatWindowElement.classList.remove(
                'text-xs',
                'md:text-base',
                'text-sm',
                'text-base',
                'text-lg',
                'text-xl',
                'text-2xl'
            );
            chatWindowElement.classList.add(`${usrSetts.font_size}`);
        }
    }

    embedYouTubeVideoSettings(usrSetts: Settings) {
        this.embedYouTubeVideos = usrSetts.embed_yt_videos;
    }

    /**
     * Displays the given chats messages.
     *
     * @param chatroomIdToLoad chat to load messages from
     */
    displayChat(chatroomIdToLoad: number) {
        this.showEmotesMenu = false;
        if (chatroomIdToLoad !== -1) {
            // create new instance here, in case any errors might happen during chatroom navigation or whatnot
            this.chatroomMessages = new Array<ChatMessageWithUser>();
            this.cursor = -1;
            // TODO: if valid, attach a listener to the div that is scrollable and simply listen and always scroll down
            // then after the initial messages are shown, e.g. after this method call below, remove the listener
            this.fetchAndDisplayChatMessages(chatroomIdToLoad, this.cursor);
        }
    }

    /**
     * Fetches and displays the (next) chat messages in the UI.
     */
    fetchAndDisplayChatMessages(chatroomIdToLoad: number, oldCursor: number) {
        return this.userService.getChatroomMessages(chatroomIdToLoad, oldCursor).subscribe((chatroomData) => {
            const [chat_messages, cursor] = chatroomData;
            this.chatroomMessages.unshift(...chat_messages);
            this.cursor = cursor;
            // if the cursor simply points to "nothing" (e.g. this is a first load of the chat), then scroll down
            // either here, or make a separate function/method and "duplicate" this function, but with no scrolling down
            if (oldCursor === -1) {
                const scrollToElement = document.getElementById('scrollToLatest');
                if (scrollToElement !== null) {
                    console.log('scrolling into view');
                    scrollToElement.scrollIntoView({ behavior: 'smooth' });
                    console.log('scrolled into view');
                } else {
                    this.scrollToLatestMessage();
                }
            }
        });
    }

    /**
     * On scroll up load the next available messages.
     * Used with the ngx-infinite-scroll library.
     * Note: some finnicky things I saw with the library:
     *      > for example, if the zoom of the page changes (and therefore the height of the scrollable element),
     *        then this method will be called again, even though there would be nothing to scroll up to
     *      > if a message has been sent/received and the "scrollToLatestMessage" method is called (also even if it did not actually scroll),
     *        we can scroll up again and the onScrollUp method will be callable once more, even though the end was already reached
     */
    onScrollUp() {
        this.fetchAndDisplayChatMessages(this.chatroomId, this.cursor);
    }

    /**
     * Sends a message to the backend for inserting, as well as sending the chat message over the
     * correct websocket room.
     */
    formGroup = new FormGroup({
        messageInput: new FormControl('', Validators.required),
    });
    sendMessage() {
        if (this.chatroomId !== -1) {
            this.userService
                .sendMessage(this.formGroup.value.messageInput, this.chatroomId)
                .subscribe((msg) => this.messageSubscribeCallback(msg));
        }
    }

    /**
     * Sends a message that contains only an image.
     *
     * @param image image to send
     */
    sendImageMessage(image: File) {
        if (this.chatroomId !== -1) {
            this.userService
                .sendImageMessage(this.chatroomId, image)
                .subscribe((msg) => this.messageSubscribeCallback(msg));
        }
    }

    private messageSubscribeCallback(msg: ChatMessageWithUser) {
        if (!msg.isimage || !msg.isfile) this.formGroup.reset();
        this.chatroomMessages.push(msg);

        // emit msg via websocket
        this.wsService.sendChatMessage(msg);

        this.scrollToLatestMessage();
    }

    /* EMOTES */

    showEmotesMenu: boolean = false;
    onEmoteMenu() {
        // TODO: show a dropdown (opened towards the top) to show the available and selectable emotes
        if (this.showEmotesMenu) {
            this.showEmotesMenu = false;
        } else {
            this.showEmotesMenu = true;
        }
    }

    onEmoteSelect(emote: Emote) {
        this.formGroup.setValue({
            messageInput: this.formGroup.value.messageInput + emote.emote,
        });
        document.getElementById('messageInput')?.focus();
        // ^ or use @ViewChield("messageInput") (#HashTagOnElement)
        // and then this.element.nativeElement.focus()
    }

    /**
     * Helper method to populate some message specific metadata information, like when it was posted and its reactions.
     * This can be further used to fully populate the whole message itself, if wanted (e.g. the "div" which contains the message).
     *
     * For now, only metadata information will be injected.
     *
     * @param message the message
     * @returns the HTML to inject into the calling component (e.g. "[innerHTML]='...'")
     */
    populateMessageHeader(message: ChatMessageWithUser) {
        const isMessageFromCurrentUser = message.user_id === this.currentUser.userId;
        const msgDate = new Date(message.posted_at); // ... just why is this needed? xD

        let emotesHTML = '';
        if (message.reactions.length >= 1) {
            // filter each reaction depending on the pre-selected emotes
            // this is useful in order to group reactions together, in case multiple people reacted with the same emote
            this.preSelectedEmotes.forEach((preSelectedEmote) => {
                const messageReactionsByEmoteId = message.reactions.filter(
                    (reaction) => reaction.emote_id === preSelectedEmote.emote_id
                );
                if (messageReactionsByEmoteId.length === 0) {
                    return;
                }

                let usernamesString = messageReactionsByEmoteId
                    .map((msgReaction) => msgReaction.users.display_name)
                    .join('\n');
                if (usernamesString) {
                    emotesHTML += `<span title="${usernamesString}">${preSelectedEmote.emote}<i class="text-blue-400 not-italic font-bold">${messageReactionsByEmoteId.length}</i></span>`;
                }
            });
        }

        // .substr(11, 5) => HH:MM format
        // .substr(11, 8) => HH:MM:SS format
        return `
                ${!isMessageFromCurrentUser ? `<b class="text-xs text-gray-400">${message.users.display_name}</b>` : ''}
                <b title="Posted at: ${msgDate}" class="text-xs text-gray-400">${msgDate
                .toISOString()
                .substr(11, 5)}</b>
                <div id="messageEmotesContainer" class="h-fit text-xs flex gap-x-2">${emotesHTML}</div>
                `;
    }

    /**
     * On click to add reactions to a chat message.
     *
     * @param message the message that was reacted on
     * @param emote the emote which was used
     */
    onEmoteReaction(message: ChatMessageWithUser, emote: Emote) {
        // get messageId and current chatroomId and the selected emoteId
        // save that info into the db, and once we receive back the MessageReaction, we notify the other user via websockets to show that reaction on their side as well
        this.userService.sendEmoteReaction(message.msg_id, emote.emote_id).subscribe((reaction) => {
            this.addEmoteReactionToMessage(reaction);
            this.wsService.sendEmoteReaction(this.chatroomId, message.msg_id, this.currentUser.userId, reaction); // send the updates to the other participant(s)
        });
    }

    /**
     * Helper function to add a new reaction to a message.
     *
     * @param reaction the reaction to add to the message
     */
    addEmoteReactionToMessage(reaction: MessageReaction) {
        const [msg, ..._] = this.chatroomMessages.filter((msg) => msg.msg_id === reaction.msg_id); // there will only ever be one filtered message here
        msg.reactions.push(reaction); // show the reaction for the current user (locally)
    }

    /**
     * Helper function to scroll to the latest message available in the UI.
     * Is being used by initial load of the chat messages,
     * and when writing, sending and receiving chat messages.
     *
     * This is also available via a pipe, made for the "lazy loaded" image messages.
     */
    scrollToLatestMessage(ms: number = 100) {
        setTimeout(function () {
            const lastMessageDiv = Array.from(document.getElementsByClassName('chat-message-div')).pop();
            lastMessageDiv?.scrollIntoView({ behavior: 'smooth' });
        }, ms);
    }

    onPaste(event: ClipboardEvent | any) {
        const items = (event.clipboardData || event.originalEvent.clipboardData).items;
        let blob: File;
        for (const item of items) {
            if (item.type.indexOf('image') === 0) {
                blob = item.getAsFile();
                this.sendImageMessage(blob);
            }
        }
    }

    /**
     * Opens an image in a new tab to view it in the original dimensions.
     *
     * @param event the onclick event
     */
    openImage(event: any) {
        const newTab = window.open();
        if (newTab) {
            const srcUrl = event.target.src;
            newTab.document.body.style.backgroundColor = 'rgb(26, 32, 44)';
            newTab.document.body.innerHTML = `<img src="${srcUrl}">`;
        }
    }

    /**
     * Delete a message that the currently logged in user posted.
     *
     * @param message the message to delete
     */
    deleteMessage(message: ChatMessageWithUser) {
        this.userService.deleteMessage(message.msg_id, this.chatroomId).subscribe((hasDeleted) => {
            if (!hasDeleted) {
                return;
            }
            this.deleteFromMessagesById(message.msg_id);
            this.wsService.deleteChatMessage(message.msg_id, message.chatroom_id);
        });
    }

    /**
     * Get the index of the message that matches the given message ID.
     *
     * @param messageId message index to get
     * @returns index of the message, -1 if not found
     */
    private getIndexOfMessageById(messageId: number): number {
        return this.chatroomMessages.findIndex((msg) => msg.msg_id === messageId);
    }

    /**
     * Remove (delete) the message from the array by its ID.
     *
     * @param messageId the message to remove from the array
     */
    private deleteFromMessagesById(messageId: number): void {
        const indexOfMessage = this.getIndexOfMessageById(messageId);
        if (indexOfMessage !== -1) {
            this.chatroomMessages.splice(indexOfMessage, 1);
        }
    }

    /**
     * Catches the event emitted from the "appDragAndDropFile" directive and does some validation.
     * If the file(s) are ok, upload them and show them as downloadable links to click (e.g. fetches the actual file data from the backend).
     *
     * @param files files that were drag-and-dropped into the chat area
     */
    async onFileDrop(files: Array<File>) {
        for (let file of files) {
            console.log('file to download', file);
            if (file.size === 0) {
                this.toastrService.error('File is either empty or a folder.', 'Invalid Upload');
            } else if (file.size < 20 * 1024 * 1024) {
                const blob = file.slice(0, 16);
                this.userService.validateFileType(blob).subscribe(([isValid, result]) => {
                    console.log(isValid, result, typeof result);
                    if (!isValid) {
                        // check if the result is null and the file.name has extension ".txt"
                        // if that is the case, we will treat the file as valid
                        if (result === null) {
                            if (file.name.split('.').pop()?.toLowerCase() !== 'txt') {
                                this.toastrService.error(
                                    `File '${file.name}' could not be uploaded`,
                                    `Unknown file type detected.`
                                );
                                return;
                            }
                        } else {
                            this.toastrService.error(
                                `File '${file.name}' could not be uploaded`,
                                `Invalid file type '${result.ext}' detected.`
                            );
                            return;
                        }
                    }
                    this.userService
                        .sendFileMessage(this.chatroomId, file)
                        .subscribe((msg) => this.messageSubscribeCallback(msg));
                });
            } else {
                this.toastrService.error('File is bigger than 20MB.', 'Invalid file size');
            }
        }
    }

    downloadFile(message: ChatMessageWithUser) {
        // TODO: make/add some type of progress bar?
        this.userService.downloadFile(this.chatroomId, message.file_uuid).subscribe((fileBlob) => {
            const link = document.createElement('a');
            link.href = window.URL.createObjectURL(fileBlob);
            link.download = `${message.msg_content}`;
            link.click();
        });
    }
}
