import { Client } from "@notionhq/client"
import dotenv from "dotenv";
import MarkdownIt from "markdown-it";
import fs from 'fs';

dotenv.config();
const markdown = new MarkdownIt();

class Controller {
    constructor(databaseId, NOTIONTOKEN) {
        this._databaseId = databaseId;
        this._notion = new Client({
            auth: NOTIONTOKEN,
        });
    }
    buildContentPage(file) {
        const content = markdown.parse(fs.readFileSync(file,'utf-8'));
        console.log(content);
        const pageContent = [];
        for (let i=0; i<= content.length; i++) {
            const token = content[i];
            switch (token?.['type']) {
                case 'heading_open':
                    pageContent.push(
                        {
                            "object":"block",
                            "type": "heading_1",
                            "heading_1": {
                                "rich_text": [
                                    {
                                        "type": "text",
                                        "text": {
                                            "content": content[i+1]['content'],
                                            "link": null
                                        },
                                        "plain_text": content[i+1]['content'],
                                    }
                                ],
                            }
                        },
                    )
                    break;
                case 'paragraph_open':
                    pageContent.push(
                        {
                            "object":"block",
                            "type": "bulleted_list_item",
                            "bulleted_list_item": {
                                "rich_text": [
                                    {
                                        "type": "text",
                                        "text": {
                                            "content": content[i+1]['content'],
                                            "link": null
                                        },
                                        "plain_text": content[i+1]['content'],
                                    }
                                ],
                            }
                        },
                    )

                default:
                    
                    break;
            }
        }
        return pageContent;
    }

    async createPage(file) {
        const content = this.buildContentPage(file);
        const pageContent = this.buildContentPage(file);
        
        await this._notion.pages.create({
            "children":pageContent,
            "parent":{
                "type":"database_id",
                "database_id":this._databaseId
            },
            "properties": {
                "Name": {
                    "title": [
                        {
                            "text": {
                                "content": "Hello world!"
                            }
                        }
                    ]
                }
            },
        });
    }

}


function main() {
    const controller = new Controller(process.env.NOTION_DATABASE_ID, process.env.NOTION_KEY);
    console.log(controller.createPage('./src/md/note1.md'));
}
main();