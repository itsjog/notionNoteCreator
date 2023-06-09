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
        let blockType;
        for (let i=0; i<= content.length; i++) {
            const token = content[i];
            switch (token?.['type']) {
                case 'bullet_list_open':
                    blockType = "bullet";
                    break;

                case 'bullet_list_close':
                    blockType = "";
                    break;

                case 'heading_open':
                    blockType = 'heading';
                    break;
                case 'heading_close':
                    blockType = '';
                    break;

                case 'inline':
                    if (blockType == "bullet") {
                        pageContent.push(
                            {
                                "object":"block",
                                "type": "bulleted_list_item",
                                "bulleted_list_item": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": content[i]['content'],
                                                "link": null
                                            },
                                            "plain_text": content[i]['content'],
                                        }
                                    ],
                                }
                            },
                        );
                    } else if (blockType == "ordered") {
                        pageContent.push(
                            {
                                "object":"block",
                                "type": "numbered_list_item",
                                "numbered_list_item": {
                                    "rich_text": [
                                        {
                                            "type": "text",
                                            "text": {
                                                "content": content[i]['content'],
                                                "link": null
                                            },
                                            "plain_text": content[i]['content'],
                                        }
                                    ],
                                }
                            },
                        );
                    } else if (blockType == "heading") {
                      pageContent.push(
                        {
                            "object":"block",
                            "type": "heading_1",
                            "heading_1": {
                                "rich_text": [
                                    {
                                        "type": "text",
                                        "text": {
                                            "content": content[i]['content'],
                                            "link": null
                                        },
                                        "plain_text": content[i]['content'],
                                    }
                                ],
                            }
                        },
                        )
                    }else {
                            pageContent.push(
                                {
                                    "object":"block",
                                    "type": "paragraph",
                                    "paragraph": {
                                        "rich_text": [
                                            {
                                                "type": "text",
                                                "text": {
                                                    "content": content[i]['content'],
                                                    "link": null
                                                },
                                            }
                                        ],
                                    }
                                },
                            );
                        }
                  

                case 'ordered_list_open':
                    blockType = 'ordered';
                    break;

                case 'ordererd_list_close':
                    blockType = "";
                    break;

                default:
                    
                    break;
            }
        }
        return pageContent;
    }

    async createPage(nombrePagina, file) {
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
                                "content": nombrePagina
                            }
                        }
                    ]
                }
            },
        });
    }

}

function manageArguments(argumentsList) {
    if (argumentsList.length<4) {
        throw new Error("You should give me page name and file name in arguments");
    }
    return {
        "pageName": argumentsList[2],
        "fileName": argumentsList[3],
    };
}


function main() {
    let argumentsList;
    try{
        argumentsList = manageArguments(process.argv);
    } catch (err) {
        console.log('Arguments missing');
        process.exit(1);
    }
    const controller = new Controller(process.env.NOTION_DATABASE_ID, process.env.NOTION_KEY);
    console.log(controller.createPage(argumentsList['pageName'], argumentsList['fileName']));
}
main();