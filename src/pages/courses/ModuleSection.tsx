import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createModule } from '../../store/slices/module';
import { createLesson } from '../../store/slices/lesson';
import { RootState, AppDispatch } from '../../store';
import {
    BookOpen, Plus, X, Bold, Italic, Underline, List, Link, 
    Image, Video, Eye, Trash2, Edit, Save, Loader2, 
    CheckCircle, AlertCircle, Type, AlignLeft, AlignCenter,
    AlignRight, Quote, Heading1, Heading2, Heading3, Play,
    FileText, HelpCircle, ClipboardList, Clock, Users,
    Settings, ChevronDown, ChevronUp, GripVertical, ArrowRight
} from 'lucide-react';
import Files from './components/Files';
import TextLesson from './components/TextLesson';
import Quiz from './components/Quiz';
import Assignment from './components/Assignment';

// Enhanced Rich Text Editor Component
const RichTextEditor = ({ value, onChange, placeholder = "Start typing..." }) => {
    const editorRef = useRef(null);
    const [isPreview, setIsPreview] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const insertLink = () => {
        const url = prompt('Enter URL:');
        if (url) {
            execCommand('createLink', url);
        }
    };

    const insertImage = () => {
        const url = prompt('Enter image URL:');
        if (url) {
            execCommand('insertImage', url);
        }
    };

    const toolbarButtons = [
        { icon: Bold, command: 'bold', title: 'Bold' },
        { icon: Italic, command: 'italic', title: 'Italic' },
        { icon: Underline, command: 'underline', title: 'Underline' },
        { icon: Heading1, command: 'formatBlock', value: 'h1', title: 'Heading 1' },
        { icon: Heading2, command: 'formatBlock', value: 'h2', title: 'Heading 2' },
        { icon: Heading3, command: 'formatBlock', value: 'h3', title: 'Heading 3' },
        { icon: AlignLeft, command: 'justifyLeft', title: 'Align Left' },
        { icon: AlignCenter, command: 'justifyCenter', title: 'Align Center' },
        { icon: AlignRight, command: 'justifyRight', title: 'Align Right' },
        { icon: List, command: 'insertUnorderedList', title: 'Bullet List' },
        { icon: Quote, command: 'formatBlock', value: 'blockquote', title: 'Quote' },
    ];

    return (
        <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-200">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 p-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 flex-wrap">
                        {toolbarButtons.slice(0, isExpanded ? toolbarButtons.length : 6).map((button, index) => (
                            <button
                                key={index}
                                type="button"
                                onClick={() => execCommand(button.command, button.value)}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-gray-900"
                                title={button.title}
                            >
                                <button.icon className="w-4 h-4" />
                            </button>
                        ))}
                        {!isExpanded && toolbarButtons.length > 6 && (
                            <button
                                type="button"
                                onClick={() => setIsExpanded(true)}
                                className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-500"
                                title="More options"
                            >
                                <Settings className="w-4 h-4" />
                            </button>
                        )}
                        <div className="w-px h-6 bg-gray-300 mx-2" />
                        <button
                            type="button"
                            onClick={insertLink}
                            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-blue-600"
                            title="Insert Link"
                        >
                            <Link className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={insertImage}
                            className="p-2 rounded-lg hover:bg-white hover:shadow-sm transition-all duration-200 text-gray-600 hover:text-green-600"
                            title="Insert Image"
                        >
                            <Image className="w-4 h-4" />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsPreview(!isPreview)}
                        className={`p-2 rounded-lg transition-all duration-200 ${
                            isPreview 
                                ? 'bg-blue-100 text-blue-600 shadow-sm' 
                                : 'hover:bg-white hover:shadow-sm text-gray-600'
                        }`}
                        title="Toggle Preview"
                    >
                        <Eye className="w-4 h-4" />
                    </button>
                </div>
            </div>
            {isPreview ? (
                <div
                    className="p-6 min-h-[200px] prose max-w-none bg-gray-50"
                    dangerouslySetInnerHTML={{ __html: value }}
                />
            ) : (
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    className="p-6 min-h-[200px] outline-none prose max-w-none focus:bg-blue-50/30 transition-colors duration-200"
                    style={{ minHeight: '200px' }}
                    suppressContentEditableWarning={true}
                    dangerouslySetInnerHTML={{ __html: value }}
                    placeholder={placeholder}
                />
            )}
        </div>
    );
};

// Module Creation Form Component
const ModuleCreationForm = ({ onModuleCreated, courseId }) => {
    const dispatch = useDispatch();
    const { loading: moduleLoading } = useSelector((state) => state.module);
    
    const [moduleData, setModuleData] = useState({
        title: '',
        description: '',
        order: 1,
        estimatedDuration: 60,
        isPublished: false
    });
    
    const [isSaving, setIsSaving] = useState(false);

    const handleCreateModule = async () => {
        if (!moduleData.title.trim()) {
            alert('Please enter a module title');
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('token') || '';
            const payload = {
                courseId,
                title: moduleData.title,
                description: moduleData.description,
                order: moduleData.order,
                estimatedDuration: moduleData.estimatedDuration,
                isPublished: moduleData.isPublished,
                token
            };

            const result = await dispatch(createModule(payload)).unwrap();
            onModuleCreated(result.data);
        } catch (error) {
            console.error('Error creating module:', error);
            alert('Failed to create module. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-white border-2 border-blue-200 rounded-2xl p-8 shadow-lg">
            <div className="text-center mb-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                    <BookOpen className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Create New Module</h3>
                <p className="text-gray-600">First, create your module. Then you'll be able to add lessons to it.</p>
            </div>

            <div className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Module Title *
                    </label>
                    <input
                        type="text"
                        value={moduleData.title}
                        onChange={e => setModuleData({ ...moduleData, title: e.target.value })}
                        placeholder="e.g., Introduction to React Basics"
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Module Description
                    </label>
                    <textarea
                        value={moduleData.description}
                        onChange={e => setModuleData({ ...moduleData, description: e.target.value })}
                        placeholder="Describe what students will learn in this module..."
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none"
                        rows={4}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Estimated Duration (minutes)
                        </label>
                        <input
                            type="number"
                            value={moduleData.estimatedDuration}
                            onChange={e => setModuleData({ ...moduleData, estimatedDuration: parseInt(e.target.value) || 60 })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            min="1"
                            placeholder="60"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Module Order
                        </label>
                        <input
                            type="number"
                            value={moduleData.order}
                            onChange={e => setModuleData({ ...moduleData, order: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                            min="1"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="isPublished"
                        checked={moduleData.isPublished}
                        onChange={e => setModuleData({ ...moduleData, isPublished: e.target.checked })}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPublished" className="text-gray-700 font-medium">
                        Publish module immediately
                    </label>
                </div>

                <div className="pt-6">
                    <button
                        onClick={handleCreateModule}
                        disabled={isSaving || !moduleData.title.trim()}
                        className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg font-semibold"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Creating Module...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Create Module
                                <ArrowRight className="w-5 h-5" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

const LessonEditor = ({ lesson, moduleId, section, courseId, onChange, onRemove, onSave }) => {
    const dispatch = useDispatch();
    const { loading: lessonLoading } = useSelector((state) => state.lesson);
    const [isSaving, setIsSaving] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [savedLessonId, setSavedLessonId] = useState(lesson._id || lesson.id || null);
    console.log('LessonEditor - Available IDs:', {
        lessonId: lesson._id || lesson.id,
        savedLessonId,
        moduleId,
        section,
        courseId,
        lesson
    });

    // Determine if this is a new lesson (not saved yet)
    const isNewLesson = !savedLessonId;

    // Auto-expand for new lessons, allow manual control for saved lessons
    const shouldShowExpanded = isNewLesson ? true : isExpanded;

    const lessonTypeConfig = {
        video: { icon: Play, label: 'File', color: 'text-red-500 bg-red-50 border-red-200' },
        text: { icon: FileText, label: 'Text Lesson', color: 'text-blue-500 bg-blue-50 border-blue-200' },
        quiz: { icon: HelpCircle, label: 'Quiz', color: 'text-green-500 bg-green-50 border-green-200' },
        assignment: { icon: ClipboardList, label: 'Assignment', color: 'text-purple-500 bg-purple-50 border-purple-200' }
    };

    const currentConfig = lessonTypeConfig[lesson.type || 'video'];

    const handleSaveLesson = async () => {
        if (!lesson.title.trim()) {
            alert('Please enter a lesson title');
            return;
        }

        // Debug logging
        console.log('Section value:', section);
        console.log('CourseId value:', courseId);
        console.log('ModuleId value:', moduleId);

        // Determine the correct section/courseId to use
        const sectionToUse = section || courseId || moduleId;
        
        if (!sectionToUse) {
            console.error('No section/courseId found. Available values:', { section, courseId, moduleId });
            alert('Error: Missing course/section information. Please try again.');
            return;
        }

        setIsSaving(true);
        try {
            const lessonData = {
                section: sectionToUse,
                moduleId,
                title: lesson.title,
                description: lesson.content || '',
                type: lesson.type || 'video',
                order: lesson.order || 1,
                isRequired: lesson.isRequired || true,
                language: 'en',
            };

            console.log('Saving lesson data:', lessonData);

            const result = await dispatch(createLesson(lessonData)).unwrap();
            
            // Extract lesson ID from the response
            const newLessonId = result?.data?._id || result?._id || result?.id;
            
            if (newLessonId) {
                setSavedLessonId(newLessonId);
                // Update the lesson object with the new ID
                const updatedLesson = { ...lesson, _id: newLessonId, id: newLessonId };
                onChange(updatedLesson);
            }

            alert('Lesson saved successfully!');
            window.location.reload();
            console.log('Lesson saved:', result);
            onSave && onSave(result);
        } catch (error) {
            console.error('Error saving lesson:', error);
            alert('Failed to save lesson');
        } finally {
            setIsSaving(false);
        }
    };

    const renderLessonForm = () => {
        const commonProps = {
            section: section || courseId,
            lesson: { ...lesson, _id: savedLessonId },
            onChange
        };

        switch (lesson.type) {
            case 'video':
                return <Files  {...commonProps}
                        courseId={courseId || section}
                        lessonId={savedLessonId}
                        moduleId={moduleId} />;
            case 'text':
                return <TextLesson {...commonProps}
                courseId={courseId || section}
                        lessonId={savedLessonId}
                        moduleId={moduleId} />;
            case 'quiz':
                return (
                    <Quiz
                        {...commonProps}
                        courseId={courseId || section}
                        lessonId={savedLessonId}
                        moduleId={moduleId}
                    />
                );
            case 'assignment':
                return (
                    <Assignment
                        {...commonProps}
                        courseId={courseId || section}
                        lessonId={savedLessonId}
                        moduleId={moduleId}
                    />
                );
            default:
                return <Files {...commonProps} />;
        }
    };

    return (
        <div className="group relative">
            {/* Main Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Header Section */}
                <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        {/* Left Side - Lesson Info */}
                        <div className="flex items-center space-x-4">
                            <div className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 ${currentConfig.color} transition-all duration-200`}>
                                <currentConfig.icon className="w-6 h-6" />
                            </div>
                            
                            <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-1">
                                    <h4 className="text-lg font-semibold text-gray-900">{currentConfig.label}</h4>
                                    {savedLessonId && (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5"></div>
                                            Saved
                                        </span>
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 font-medium">
                                    Lesson #{lesson.order || 1}
                                </p>
                            </div>
                        </div>

                        {/* Right Side - Actions */}
                        <div className="flex items-center space-x-2">
                            {/* Expand/Collapse Button - Only for saved lessons */}
                            {isNewLesson && (
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-all duration-200"
                                    title={isExpanded ? "Collapse lesson" : "Expand lesson"}
                                >
                                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </button>
                            )}
                            {/* {!isNewLesson && (
                                <a
                                    href={
                                        lesson.type === 'quiz'
                                            ? `/quizzes/${savedLessonId}`
                                            : lesson.type === 'assignment'
                                            ? `/assignments/${savedLessonId}`
                                            : lesson.type === 'text'
                                            ? `/text-lessons/${savedLessonId}`
                                            : `/files/${savedLessonId}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 text-blue-600 hover:text-blue-800 transition-all duration-200"
                                    title="Go to lesson details"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </a>
                            )} */}
                            
                            {/* Save Button */}
                            <button 
                                type="button" 
                                onClick={handleSaveLesson}
                                disabled={isSaving}
                                className="flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{isSaving ? 'Saving...' : savedLessonId ? 'Update' : 'Save'}</span>
                            </button>
                            
                            {/* Remove Button */}
                            <button 
                                type="button" 
                                onClick={onRemove} 
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 transition-all duration-200"
                                title="Remove lesson"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Basic Form Section */}
                <div className="p-5 bg-white">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Lesson Title</label>
                            <input
                                type="text"
                                value={lesson.title}
                                onChange={e => onChange({ ...lesson, title: e.target.value })}
                                placeholder="Enter lesson title..."
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">Lesson Type</label>
                            <select
                                value={lesson.type || 'video'}
                                onChange={e => onChange({ ...lesson, type: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-base"
                            >
                                <option value="video">📹 File</option>
                                <option value="text">📄 Text Lesson</option>
                                <option value="quiz">❓ Quiz</option>
                                <option value="assignment">📋 Assignment</option>
                            </select>
                        </div>
                    </div>

                    {/* Warning Message for Quiz/Assignment */}
                    {(lesson.type === 'quiz' || lesson.type === 'assignment') && !savedLessonId && (
                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start space-x-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h5 className="font-medium text-amber-800">Save Required</h5>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Please save the lesson first to access {lesson.type} content creation tools.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Expanded Content */}
                {shouldShowExpanded && (
                    <div className="border-t border-gray-100">
                        {/* Lesson Content Form */}
                        <div className="p-5 bg-gray-50">
                            {renderLessonForm()}
                        </div>
                        
                        {/* Settings Section */}
                        <div className="p-5 bg-white border-t border-gray-100">
                            <h5 className="text-sm font-semibold text-gray-900 mb-4">Lesson Settings</h5>
                            <div className="flex flex-wrap items-center gap-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={lesson.isRequired || true}
                                        onChange={e => onChange({ ...lesson, isRequired: e.target.checked })}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                    />
                                    <span className="text-sm font-medium text-gray-700">Required Lesson</span>
                                </label>
                                
                                <div className="flex items-center space-x-3">
                                    <label className="text-sm font-medium text-gray-700">Display Order:</label>
                                    <input
                                        type="number"
                                        value={lesson.order || 1}
                                        onChange={e => onChange({ ...lesson, order: parseInt(e.target.value) || 1 })}
                                        className="w-20 px-3 py-2 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Updated SavedModuleDisplay with improved layout
const SavedModuleDisplay = ({ module, courseId, onAddLesson, onLessonChange, onLessonRemove }) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const totalLessons = module.lessons?.length || 0;

    const addLesson = () => {
        const newLesson = {
            title: '',
            content: '',
            type: 'video',
            order: totalLessons + 1,
            isRequired: true,
            _id: null, // Initially null, will be set after saving
        };
        onAddLesson(newLesson);
    };

    // Extract courseId from multiple possible sources
    const extractedCourseId = courseId || 
                             module?.courseId || 
                             module?.module?.courseId || 
                             module?.course?.id || 
                             module?.course?._id;

    console.log('SavedModuleDisplay - Available IDs:', {
        courseId,
        'module.courseId': module?.courseId,
        'module.module.courseId': module?.module?.courseId,
        'module._id': module?._id,
        'module.id': module?.id,
        extractedCourseId
    });

    return (
        <div className="bg-white border border-gray-200  shadow-lg overflow-hidden">
            {/* Module Header */}
            <div className="bg-gradient-to-r from-blue-50 via-blue-50 to-indigo-50 border-b border-blue-100">
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        {/* Left Side - Module Info */}
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                                <CheckCircle className="w-8 h-8 text-white" />
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="text-xl text-gray-900 mb-2">{module.title}</h3>
                                
                                {/* Stats Row */}
                                <div className="flex items-center space-x-6 text-sm">
                                    <div className="flex items-center space-x-2 text-gray-600">
                                        <BookOpen className="w-4 h-4" />
                                        <span className="font-medium">{totalLessons} lesson{totalLessons !== 1 ? 's' : ''}</span>
                                    </div>
                                    
                                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                        module.isPublished 
                                            ? 'bg-emerald-100 text-emerald-800' 
                                            : 'bg-amber-100 text-amber-800'
                                    }`}>
                                        <div className={`w-2 h-2 rounded-full mr-2 ${
                                            module.isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                                        }`}></div>
                                        {module.isPublished ? 'Published' : 'Draft'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side - Toggle Button */}
                        <button
                            type="button"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/70 hover:bg-white text-gray-600 hover:text-gray-800 transition-all duration-200 shadow-sm"
                        >
                            {isExpanded ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Lessons Section */}
            {!isExpanded && (
                <div className="p-6">
                    {/* Section Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <h4 className="text-xl font-semibold text-gray-900">
                                Lessons {totalLessons > 0 && <span className="text-gray-500">({totalLessons})</span>}
                            </h4>
                        </div>
                        
                        <button
                            type="button"
                            onClick={addLesson}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Add Lesson</span>
                        </button>
                    </div>
                    
                    {/* Lessons List */}
                    <div className="space-y-6">
                        {module.lessons?.map((lesson, idx) => (
                            <LessonEditor
                                key={lesson._id || lesson.id || idx}
                                lesson={lesson}
                                moduleId={module?.module?._id || module?._id}
                                section={extractedCourseId}
                                courseId={extractedCourseId}
                                onChange={l => onLessonChange(idx, l)}
                                onRemove={() => onLessonRemove(idx)}
                                onSave={(savedLesson) => {
                                    // Update the lesson with the saved data
                                    onLessonChange(idx, savedLesson);
                                }}
                            />
                        ))}
                        
                        {/* Empty State */}
                        {totalLessons === 0 && (
                            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <BookOpen className="w-10 h-10 text-blue-600" />
                                </div>
                                <h4 className="text-xl font-semibold text-gray-900 mb-2">Ready to Create Lessons!</h4>
                                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                                    Your module is set up and ready. Start building your course content by adding your first lesson.
                                </p>
                                <button
                                    type="button"
                                    onClick={addLesson}
                                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>Add First Lesson</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Main Enhanced Module Section Component
const ModuleSection = ({ courseId, modules = [], onModulesChange, courseData, isEditing = false }) => {
    const { loading: moduleLoading, error: moduleError } = useSelector((state) => state.module);
    const { loading: lessonLoading, error: lessonError } = useSelector((state) => state.lesson);
    
    const [savedModules, setSavedModules] = useState([]);
    const [showCreateForm, setShowCreateForm] = useState(false);

    // Initialize modules from props when component mounts or modules prop changes
    useEffect(() => {
        if (modules && modules.length > 0) {
            setSavedModules(modules);
        }
    }, [modules]);

    const handleModuleCreated = (newModule) => {
        const updatedModules = [...savedModules, { ...newModule, lessons: [] }];
        setSavedModules(updatedModules);
        setShowCreateForm(false);
        
        // Call parent callback if provided
        if (onModulesChange) {
            onModulesChange(updatedModules);
        }
    };

    const addLessonToModule = (moduleIndex, newLesson) => {
        const updatedModules = savedModules.map((module, idx) =>
            idx === moduleIndex
                ? { ...module, lessons: [...(module.lessons || []), newLesson] }
                : module
        );
        setSavedModules(updatedModules);
        
        if (onModulesChange) {
            onModulesChange(updatedModules);
        }
    };

    const updateLessonInModule = (moduleIndex, lessonIndex, updatedLesson) => {
        const updatedModules = savedModules.map((module, idx) =>
            idx === moduleIndex
                ? {
                    ...module,
                    lessons: (module.lessons || []).map((lesson, lIdx) =>
                        lIdx === lessonIndex ? updatedLesson : lesson
                    )
                }
                : module
        );
        setSavedModules(updatedModules);
        
        if (onModulesChange) {
            onModulesChange(updatedModules);
        }
    };

    const removeLessonFromModule = (moduleIndex, lessonIndex) => {
        if (window.confirm('Are you sure you want to delete this lesson?')) {
            const updatedModules = savedModules.map((module, idx) =>
                idx === moduleIndex
                    ? { ...module, lessons: (module.lessons || []).filter((_, lIdx) => lIdx !== lessonIndex) }
                    : module
            );
            setSavedModules(updatedModules);
            
            if (onModulesChange) {
                onModulesChange(updatedModules);
            }
        }
    };

    const totalModules = savedModules.length;
    const publishedModules = savedModules.filter(m => m.isPublished).length;
    const totalLessons = savedModules.reduce((sum, m) => sum + (m.lessons?.length || 0), 0);

    return (
        <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl p-8">
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-xl">
                                <BookOpen className="w-8 h-8 text-blue-600" />
                            </div>
                            Course Modules
                        </h2>
                        <p className="text-gray-600 mt-2">Build your course content step by step</p>
                    </div>
                    {!showCreateForm && (
                        <button
                            type="button"
                            onClick={() => setShowCreateForm(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            <Plus className="w-5 h-5" />
                            Create Module
                        </button>
                    )}
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Modules</p>
                                <p className="text-2xl font-bold text-gray-900">{totalModules}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Published Modules</p>
                                <p className="text-2xl font-bold text-gray-900">{publishedModules}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <Users className="w-5 h-5 text-yellow-600" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Lessons</p>
                                <p className="text-2xl font-bold text-gray-900">{totalLessons}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Module Creation Form */}
                {showCreateForm && (
                    <div className="mb-6">
                        <ModuleCreationForm
                            onModuleCreated={handleModuleCreated}
                            courseId={courseId}
                        />
                    </div>
                )}

                {/* Saved Modules Display */}
               <div className="space-y-6">
    {savedModules.map((module, index) => (
        <SavedModuleDisplay
            key={module._id || index}
            module={module}
            courseId={courseId} // Pass courseId explicitly
            onAddLesson={(newLesson) => addLessonToModule(index, newLesson)}
            onLessonChange={(lessonIndex, updatedLesson) => updateLessonInModule(index, lessonIndex, updatedLesson)}
            onLessonRemove={(lessonIndex) => removeLessonFromModule(index, lessonIndex)}
        />
    ))}

    {moduleLoading && (
        <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="mt-4 text-gray-600">Loading modules...</p>
        </div>
    )}

    {moduleError && (
        <div className="text-red-600 text-center py-8">
            <p>Error loading modules: {moduleError.message}</p>
        </div>
    )}

    {savedModules.length === 0 && !moduleLoading && !moduleError && !showCreateForm && (
        <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No modules created yet!</h4>
            <p className="text-gray-600 mb-4">Start by creating your first module.</p>
            <button
                type="button"
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 mx-auto"
            >
                <Plus className="w-4 h-4" />
                Create First Module
            </button>
        </div>
    )}
</div>
            </div>
        </div>
    );
};
export default ModuleSection;