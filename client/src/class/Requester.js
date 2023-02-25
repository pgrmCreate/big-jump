export class Requester {
    //static localUrl = 'http://localhost:3001';
    static localUrl = 'https://big-jump.osc-fr1.scalingo.io';
    static token = null;

    static request(url, type, isPublic, data = null) {
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        };

        if(Requester.token && isPublic === false) {
            headers.Authorization = 'Bearer ' + Requester.token;
        }

        return fetch(`${Requester.localUrl}${url}`, {
            method: type,
            mode: "cors",
            headers : headers,
            credentials: 'include',
            body : data ? JSON.stringify(data) : undefined
        });
    }

    static get(url, isPublic = false) {
        return Requester.request(url, 'GET', isPublic);
    }

    static delete(url, isPublic = false) {
        return Requester.request(url, 'DELETE', isPublic);
    }

    static post(url, data, isPublic = false) {
        return Requester.request(url, 'POST', isPublic, data);
    }
}
