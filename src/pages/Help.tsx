import React, { useState, useRef, useEffect } from 'react';
import { Mail, MessageCircle, Send, Bot, User } from 'lucide-react';

export const Help: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([
    { role: 'assistant', text: 'Здравствуйте! Я ИИ-помощник платформы "Студенческий подряд". Чем могу помочь вам сегодня?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, text: userMessage }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: newMessages,
          systemInstruction: 'Ты дружелюбный ИИ-помощник платформы "Студенческий подряд". Помогай пользователям ориентироваться на сайте и объясняй рабочий цикл простыми словами. Платформа предназначена для студентов 1-3 курсов ИТ-, дизайн- и медиа-направлений, которые выбирают прикладные микрозадачи для портфолио, и учреждений культуры, которые размещают цифровые задачи. Основные разделы: Каталог задач, Сокомандники, Моё портфолио, Офлайн мероприятия, Кабинет организации, Создание задачи и Управление публикациями. Отвечай кратко, вежливо и по делу. Если вопрос не касается платформы, вежливо скажи, что можешь помочь только с вопросами по сайту.'
        })
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: 'Извините, я не смог сгенерировать ответ.' }]);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Произошла ошибка при обращении к ИИ. Пожалуйста, попробуйте позже.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Помощь и поддержка</h1>
        <p className="mt-2 text-gray-600">
          Здесь вы можете найти контактную информацию для связи с администрацией или задать вопрос нашему ИИ-помощнику.
        </p>
      </div>

      <div className="help-support-grid grid grid-cols-1 gap-8 md:grid-cols-[minmax(19rem,0.9fr)_minmax(0,2fr)]">
        <div className="help-contact-column space-y-6">
          <div className="a11y-help-contact-card a11y-force-surface bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Контакты</h2>
            <div className="space-y-4">
              <a 
                href="mailto:ershovivan2802@yandex.ru" 
                className="flex items-center text-gray-600 hover:text-blue-700 transition-colors"
              >
                <Mail className="h-5 w-5 mr-3 text-blue-500" />
                <span className="a11y-help-email">ershovivan2802@yandex.ru</span>
              </a>
              <a 
                href="https://vk.com/id851472524" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center text-gray-600 hover:text-blue-700 transition-colors"
              >
                <MessageCircle className="h-5 w-5 mr-3 text-blue-500" />
                <span>ВКонтакте</span>
              </a>
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl flex items-center">
              <Bot className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">ИИ-помощник по сайту</h2>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex items-start max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${msg.role === 'user' ? 'bg-blue-100 ml-3' : 'bg-gray-100 mr-3'}`}>
                      {msg.role === 'user' ? <User className="h-5 w-5 text-blue-600" /> : <Bot className="h-5 w-5 text-gray-600" />}
                    </div>
                    <div className={`a11y-chat-bubble p-3 rounded-2xl ${msg.role === 'user' ? 'a11y-chat-bubble-user bg-blue-600 text-white rounded-tr-none' : 'a11y-chat-bubble-assistant bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-start max-w-[80%] flex-row">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 mr-3">
                      <Bot className="h-5 w-5 text-gray-600" />
                    </div>
                    <div className="a11y-chat-bubble-assistant p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-tl-none flex space-x-2 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-100">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Задайте вопрос о платформе..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  className="bg-blue-600 text-white p-2 rounded-xl hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
