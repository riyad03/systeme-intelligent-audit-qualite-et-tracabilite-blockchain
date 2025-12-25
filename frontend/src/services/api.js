import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000';

export const uploadAndAnalyze = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await axios.post(`${API_BASE_URL}/upload_and_analyze`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            // Increase timeout for long AI processing
            timeout: 120000
        });
        return response.data;
    } catch (error) {
        console.error("Error analyzing file:", error);
        throw error;
    }
};

export const downloadPDF = async (data) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/generate_pdf`, data, {
            responseType: 'blob',
        });
        return response.data;
    } catch (error) {
        console.error("Error generating PDF:", error);
        throw error;
    }
};
