/**
 * API для взаимодействия с серверной частью
 */

const API = {
    /**
     * Выполнить GET-запрос
     * @param {string} url - URL для запроса
     * @param {Object} [params] - Параметры запроса
     * @returns {Promise<any>} - Результат запроса
     */
    get: function(url, params = {}) {
        console.log(`Выполняю GET запрос: ${url}`);
        return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Получен ответ для ${url}:`, data);
            return data;
        });
    },
    
    /**
     * Выполнить POST-запрос
     * @param {string} url - URL для запроса
     * @param {Object} data - Данные для отправки
     * @returns {Promise<any>} - Результат запроса
     */
    post: function(url, data = {}) {
        console.log(`Выполняю POST запрос: ${url}`, data);
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Получен ответ для ${url}:`, data);
            return data;
        });
    },
    
    /**
     * Выполнить PUT-запрос
     * @param {string} url - URL для запроса
     * @param {Object} data - Данные для отправки
     * @returns {Promise<any>} - Результат запроса
     */
    put: function(url, data = {}) {
        console.log(`Выполняю PUT запрос: ${url}`, data);
        return fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Получен ответ для ${url}:`, data);
            return data;
        });
    },
    
    /**
     * Выполнить DELETE-запрос
     * @param {string} url - URL для запроса
     * @returns {Promise<any>} - Результат запроса
     */
    delete: function(url) {
        console.log(`Выполняю DELETE запрос: ${url}`);
        return fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            console.log(`Получен ответ для ${url}:`, data);
            return data;
        });
    }
};