export const fetchDynamicJSON = function (url, data, onSuccess, onError) {
    fetch(url, {
        method: 'POST',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error();
            }
            return response.json()
        })
        .then(onSuccess)
        .catch(onError);
}
