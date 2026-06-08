import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../services/axiosConfig";

interface ZoomState {
    loading: boolean;
    error: string | null;
    meetings: any[];
    currentMeeting: any | null;
    participants: any[];
    reports: any[];
}

const initialState: ZoomState = {
    loading: false,
    error: null,
    meetings: [],
    currentMeeting: null,
    participants: [],
    reports: [],
};

export const createMeeting = createAsyncThunk(
    "zoom/createMeeting",
    async (meetingData: any, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.post("/zoom/meetings", meetingData);
            return response.data?.meeting || response.data?.data || response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchMeetings = createAsyncThunk(
    "zoom/fetchMeetings",
    async (_, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/zoom/meetings");
            // Handle the nested structure: response.data.meetings.meetings
            if (response.data?.meetings?.meetings) {
                return response.data.meetings.meetings;
            }
            return response.data?.meetings || response.data || [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchMeetingById = createAsyncThunk(
    "zoom/fetchMeetingById",
    async (meetingId: string, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get(`/zoom/meetings/${meetingId}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const deleteMeeting = createAsyncThunk(
    "zoom/deleteMeeting",
    async (meetingId: string, { rejectWithValue }) => {
        try {
            await axiosInstance.delete(`/zoom/meetings/${meetingId}`);
            return meetingId;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchMeetingParticipants = createAsyncThunk(
    "zoom/fetchMeetingParticipants",
    async (params: { id: string | number; uuid?: string }, { rejectWithValue }) => {
        try {
            const { id, uuid } = params;
            // Use numeric ID in path, pass UUID as query param for Zoom reports API
            const query = uuid ? `?uuid=${encodeURIComponent(uuid)}` : "";
            const response = await axiosInstance.get(`/zoom/meetings/${id}/participants${query}`);
            return response.data?.participants || response.data || [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchReports = createAsyncThunk(
    "zoom/fetchReports",
    async (params: { from?: string; to?: string } | undefined, { rejectWithValue }) => {
        try {
            const response = await axiosInstance.get("/zoom/reports/meetings", { params });
            return response.data?.meetings || response.data || [];
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const zoomSlice = createSlice({
    name: "zoom",
    initialState,
    reducers: {
        clearZoomError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch Meetings
            .addCase(fetchMeetings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMeetings.fulfilled, (state, action) => {
                state.loading = false;
                state.meetings = Array.isArray(action.payload) ? action.payload : [];
            })
            .addCase(fetchMeetings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Create Meeting
            .addCase(createMeeting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createMeeting.fulfilled, (state, action) => {
                state.loading = false;
                state.meetings.unshift(action.payload);
            })
            .addCase(createMeeting.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Meeting By Id
            .addCase(fetchMeetingById.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMeetingById.fulfilled, (state, action) => {
                state.loading = false;
                state.currentMeeting = action.payload;
            })
            .addCase(fetchMeetingById.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Delete Meeting
            .addCase(deleteMeeting.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteMeeting.fulfilled, (state, action) => {
                state.loading = false;
                state.meetings = state.meetings.filter(
                    (m) => (m.id || m._id) !== action.payload
                );
            })
            .addCase(deleteMeeting.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Participants
            .addCase(fetchMeetingParticipants.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMeetingParticipants.fulfilled, (state, action) => {
                state.loading = false;
                state.participants = action.payload;
            })
            .addCase(fetchMeetingParticipants.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Fetch Reports
            .addCase(fetchReports.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchReports.fulfilled, (state, action) => {
                state.loading = false;
                state.reports = action.payload;
            })
            .addCase(fetchReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearZoomError } = zoomSlice.actions;
export default zoomSlice.reducer;
