import axios from 'axios';

export const fetchData = async (suffix: string) => {
    const url = 'http://localhost:3001' + suffix;
    console.log("fetch url", url)
    try {
        const response = await axios.get('http://localhost:3001' + suffix, {

        });
        if (response.status !== 200) {
            throw new Error(`HTTP error on endpoint call! Status: ${response.status}`);
        }

        const data = response.data;
        return (data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
};
