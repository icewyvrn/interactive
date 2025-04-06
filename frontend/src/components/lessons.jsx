import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Plus,
  BookOpen,
  ArrowRight,
  BookOpenCheck,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const Lessons = () => {
  const navigate = useNavigate();
  const { quarterId } = useParams();
  const [lessons, setLessons] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const nextLessonNumber = lessons.length + 1;

  // Array of vibrant card accent colors
  const cardColors = [
    'border-l-emerald-500', // green
    'border-l-sky-500', // blue
    'border-l-teal-500', // teal
    'border-l-amber-500', // amber
  ];

  useEffect(() => {
    fetchLessons();
  }, [quarterId]);

  const fetchLessons = async () => {
    try {
      setIsLoading(true);
      // Updated API endpoint to match backend route
      const response = await axios.get(`/api/lessons/${quarterId}/lessons`);
      if (response.data.success) {
        setLessons(response.data.lessons);
      }
    } catch (error) {
      console.error('Error:', error);
      setLessons([]); // Ensure empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLesson = async () => {
    try {
      const response = await axios.post(`/api/lessons/${quarterId}/lessons`, {
        title: newLessonTitle,
      });

      if (response.data.success) {
        setIsDialogOpen(false);
        setNewLessonTitle('');
        fetchLessons();
      }
      toast.success('Lesson created successfully!');
    } catch (error) {
      setError('Failed to add lesson');
      console.error('Error:', error);
    }
  };

  const handleLessonClick = (lessonId) => {
    navigate(`/quarter/${quarterId}/lesson/${lessonId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            Quarter <ChevronRight className="mx-1 h-5 w-5" /> Lessons
          </h1>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="bg-indigo-700 text-white hover:bg-indigo-800"
          >
            <Plus className="w-4 h-4" />
            Add Lesson
          </Button>
        </div>

        {/* Add Lesson Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Lesson Number</Label>
                <Input
                  value={nextLessonNumber}
                  disabled
                  className="bg-gray-50"
                />
              </div>
              <div className="space-y-2">
                <Label>Lesson Title</Label>
                <Input
                  placeholder="Enter lesson title"
                  value={newLessonTitle}
                  onChange={(e) => setNewLessonTitle(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-indigo-700 text-white hover:bg-indigo-800"
                onClick={handleAddLesson}
                disabled={!newLessonTitle.trim()}
              >
                Create Lesson
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && <p className="text-red-500 mb-4">{error}</p>}

        {isLoading ? (
          <div className="text-center">Loading lessons...</div>
        ) : lessons.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Lessons Yet
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by creating your first lesson
            </p>
            <Button
              onClick={() => setIsDialogOpen(true)}
              className="bg-indigo-700 text-white hover:bg-indigo-800"
            >
              <Plus className="w-4 h-4" />
              Create First Lesson
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {lessons.map((lesson, index) => (
              <Card
                key={lesson.id}
                className={`hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer border-0 shadow rounded-lg overflow-hidden border-l-8 ${
                  cardColors[index % cardColors.length]
                }`}
                onClick={() => handleLessonClick(lesson.id)}
              >
                <div className="flex items-center p-5">
                  <div className="bg-gray-100 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <BookOpenCheck className="h-6 w-6 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm uppercase font-semibold text-gray-500 mb-1">
                      Lesson {lesson.lesson_number}
                    </div>
                    <h3 className="font-medium text-lg text-gray-800">
                      {lesson.title || 'No title set'}
                    </h3>
                  </div>
                </div>
                <div className="px-5 py-4 flex justify-end items-center border-t">
                  <span className="text-sm font-medium text-blue-600 flex items-center">
                    View lesson
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Lessons;
