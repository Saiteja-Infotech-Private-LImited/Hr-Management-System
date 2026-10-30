
import axios from "axios";

// ============================================================
// BASE URL CONFIGURATION
// ============================================================

const API_BASE_URL = (
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "https://hrms.saitejainfotechprivatelimited.com"
).replace(/\/+$/, "");

// ============================================================
// AXIOS INSTANCE
// ============================================================

const holidayApi = axios.create({
    baseURL: `${API_BASE_URL}/api/holidays`,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
    timeout: 30000,
});

// ============================================================
// ADD JWT TOKEN AUTOMATICALLY
// ============================================================

holidayApi.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token =
                localStorage.getItem("token") ||
                localStorage.getItem("accessToken") ||
                sessionStorage.getItem("token") ||
                sessionStorage.getItem("accessToken");

            if (token && token !== "undefined" && token !== "null") {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// ============================================================
// RESPONSE INTERCEPTOR - ERROR LOGGING
// ============================================================

holidayApi.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error(
            "Holiday API Error:",
            error.response?.status,
            error.response?.data || error.message
        );

        return Promise.reject(error);
    }
);

// ============================================================
// GET ALL HOLIDAYS
// ============================================================

export const getAllHolidays = async () => {
    const response = await holidayApi.get("");
    return response.data;
};

// ============================================================
// GET HOLIDAY BY ID
// ============================================================

export const getHolidayById = async (id) => {
    const response = await holidayApi.get(`/${id}`);
    return response.data;
};

// ============================================================
// CREATE HOLIDAY
// ============================================================

export const createHoliday = async (holidayData) => {
    const response = await holidayApi.post("", holidayData);
    return response.data;
};

// ============================================================
// UPDATE HOLIDAY
// ============================================================

export const updateHoliday = async (id, holidayData) => {
    const response = await holidayApi.put(`/${id}`, holidayData);
    return response.data;
};

// ============================================================
// DELETE HOLIDAY
// ============================================================

export const deleteHoliday = async (id) => {
    const response = await holidayApi.delete(`/${id}`);
    return response.data;
};

// ============================================================
// GET HOLIDAYS BETWEEN DATES
// ============================================================

export const getHolidaysBetween = async (startDate, endDate) => {
    const response = await holidayApi.get("/between", {
        params: {
            startDate,
            endDate,
        },
    });

    return response.data;
};

// ============================================================
// EXPORT AXIOS INSTANCE
// ============================================================

export default holidayApi;
