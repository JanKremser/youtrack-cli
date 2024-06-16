import axios, { AxiosRequestConfig, AxiosHeaders } from "axios";

const API_ENDPOINT = process.env.YOUTRACK_API_ENDPOINT;
const TOCKEN = process.env.YOUTRACK_TOCKEN;

const HEADERS = {
    Authorization: `Bearer ${TOCKEN}`,
};

type CustomObject = null | object;
type Response<T, E> = [T, E];
type Resp = Response<CustomObject, CustomObject>;

type IssuesSchema = {
    idReadable: string;
    summary: string;
    description: string;
    customFields: {
        value: any;
        name: string;
    }[];
    updated: number;
    created: number;
};

type SpendTime = {
    minutes: number;
    presentation: string;
};

export type Issue = {
    id: string;
    summary: string;
    description: string;
    assignees: string[];
    state: string;
    sizing: string | null;
    spent_time: SpendTime | null;
    updated: number;
    created: number;
};

function formatIssues(items: IssuesSchema[]): Issue[] {
    let issues: Issue[] = [];

    for (let item of items) {
        let customFields = item.customFields;

        let assignees: string[] = [];
        let state: string | null = null;
        let sizing: string | null = null;
        let spent_time: SpendTime | null = null;
        for (let custom of customFields) {
            if (custom.name == "Assignee") {
                let values: {
                    name: string;
                }[] = custom.value;

                for (let val of values) {
                    assignees.push(val.name);
                }
            }

            if (custom.name == "State") {
                let value: {
                    name: string;
                } = custom.value;

                state = value.name;
            }

            if (custom.name == "Ticket sizing") {
                let value: {
                    name: string;
                } | null = custom.value;

                sizing = value == null ? null : value.name;
            }

            if (custom.name == "Spent time") {
                let value: SpendTime = custom.value;

                spent_time = value;
            }
        }

        if (state == null) continue;

        issues.push({
            id: item.idReadable,
            summary: item.summary,
            description: item.description,
            assignees: assignees,
            state: state,
            sizing: sizing,
            spent_time: spent_time,
            updated: item.updated,
            created: item.created,
        });
    }

    return issues;
}

async function listAllIssues(): Promise<null | Issue[]> {
    //console.log(headers);
    let [ok, err]: Resp = await axios
        .get(`${API_ENDPOINT}/api/issues`, {
            headers: HEADERS,
            params: {
                fields: "$type,created,customFields($type,id,name,value($type,id,name,presentation,minutes)),description,id,idReadable,links($type,direction,id,linkType($type,id,localizedName,name)),numberInProject,project($type,id,name,shortName),reporter($type,id,login,ringId),resolved,summary,updated,updater($type,id,login,ringId),visibility($type,id,permittedGroups($type,id,name,ringId),permittedUsers($type,id,login,ringId))",
                //customFields: 'Assignee,Type,State,Subsystem',
            },
        } as AxiosRequestConfig)
        .then((response) => {
            return [response.data, null] as Resp;
        })
        .catch((err) => {
            return [null, err] as Resp;
        });

    if (ok == null) {
        console.error("error", err);
        return null;
    }

    return formatIssues(ok as IssuesSchema[]);
}

async function getIssue(issueId: string): Promise<null | Issue> {
    let [ok, err]: Resp = await axios
        .get(`${API_ENDPOINT}/api/issues/${issueId}`, {
            headers: HEADERS,
            params: {
                fields: "$type,created,customFields($type,id,name,value($type,id,name,presentation,minutes)),description,id,idReadable,links($type,direction,id,linkType($type,id,localizedName,name)),numberInProject,project($type,id,name,shortName),reporter($type,id,login,ringId),resolved,summary,updated,updater($type,id,login,ringId),visibility($type,id,permittedGroups($type,id,name,ringId),permittedUsers($type,id,login,ringId))",
            },
        })
        .then((response) => {
            return [response.data, null] as Resp;
        })
        .catch((err) => {
            return [null, err] as Resp;
        });

    if (ok == null) {
        return null;
    }

    return formatIssues([ok] as IssuesSchema[])[0];
}

async function postTimeTrackingItem(
    issueId: string,
    durationInSec: number,
    text: string,
    date: Date = new Date()
): Promise<boolean> {
    const durationInMin = (durationInSec / 60).toFixed(0);

    let [ok, err]: Resp = await axios
        .post(
            `${API_ENDPOINT}/api/issues/${issueId}/timeTracking/workItems`,
            {
                date: date.getTime(),
                duration: {
                    presentation: `${durationInMin}m`,
                },
                text: text,
            },
            {
                headers: HEADERS,
            } as AxiosRequestConfig
        )
        .then((response) => {
            return [response.data, null] as Resp;
        })
        .catch((err) => {
            return [null, err] as Resp;
        });

    if (ok == null) {
        return false;
    }

    return true;
}

export default {
    listAllIssues,
    getIssue,
    postTimeTrackingItem,
};
