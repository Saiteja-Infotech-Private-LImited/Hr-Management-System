'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

import {
  getAdminNotifications,
  getAdminUnreadCount,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
  deleteAdminNotification,
  clearAllAdminNotifications,
} from '@/lib/adminApi';

import api from '@/lib/axios';
import toast from 'react-hot-toast';

import {
  Trash2,
  X,
} from 'lucide-react';


function formatTimeAgo(dateStr, now) {
  if (!dateStr) return '';

  const diff = now - new Date(dateStr).getTime();

  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;

  return `${days}d ago`;
}


export default function AdminNotificationsPage() {

  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState('ALL');

  const [markingAll, setMarkingAll] = useState(false);

  const [deletingId, setDeletingId] = useState(null);

  const [clearingAll, setClearingAll] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [showClearModal, setShowClearModal] = useState(false);

  const [notificationToDelete, setNotificationToDelete] =
    useState(null);

  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [now, setNow] = useState(() => Date.now());


  /*
   * Update notification time
   */
  useEffect(() => {

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 60000);

    return () => clearInterval(timer);

  }, []);


  /*
   * Fetch notifications
   */
  const fetchNotifications = useCallback(async () => {

    setLoading(true);

    try {

      const [
        notifRes,
        unreadRes,
      ] = await Promise.allSettled([

        filter === 'UNREAD'
          ? api.get(
              `/api/notifications/unread?page=${page}&size=10`
            )
          : getAdminNotifications(page, 10),

        getAdminUnreadCount(),

      ]);


      /*
       * Notifications
       */
      if (notifRes.status === 'fulfilled') {

        const data =
          notifRes.value.data?.data;

        setNotifications(
          data?.content || []
        );

        setTotalPages(
          data?.totalPages || 0
        );
      }


      /*
       * Unread count
       */
      if (unreadRes.status === 'fulfilled') {

        setUnreadCount(
          unreadRes.value.data?.data || 0
        );
      }

    } catch (error) {

      console.error(
        'Failed to load notifications:',
        error
      );

      toast.error(
        'Failed to load notifications'
      );

    } finally {

      setLoading(false);

    }

  }, [filter, page]);


  /*
   * Load notifications
   */
  useEffect(() => {

    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);

    return () => clearTimeout(timer);

  }, [fetchNotifications]);


  /*
   * Mark one notification as read
   */
  const handleMarkRead = async (id) => {

    const notification =
      notifications.find(
        (n) => n.id === id
      );

    if (!notification || notification.isRead) {
      return;
    }


    /*
     * Optimistic update
     */
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id
          ? { ...n, isRead: true }
          : n
      )
    );

    setUnreadCount((prev) =>
      Math.max(0, prev - 1)
    );


    try {

      await markAdminNotificationRead(id);

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

    } catch (error) {

      console.error(
        'Failed to mark as read:',
        error
      );

      toast.error(
        'Failed to mark as read'
      );

      fetchNotifications();

    }

  };


  /*
   * Mark all notifications as read
   */
  const handleMarkAll = async () => {

    setMarkingAll(true);

    try {

      await markAllAdminNotificationsRead();

      setNotifications((prev) =>
        prev.map((n) => ({
          ...n,
          isRead: true,
        }))
      );

      setUnreadCount(0);

      toast.success(
        'All notifications marked as read!'
      );

      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

    } catch (error) {

      console.error(
        'Failed to mark all as read:',
        error
      );

      toast.error(
        'Failed to mark all as read'
      );

    } finally {

      setMarkingAll(false);

    }

  };


  /*
   * Notification click
   *
   * Keeps the existing navigation behavior.
   */
  const handleNotificationClick = async (
    notification
  ) => {

    try {

      if (!notification.isRead) {
        await handleMarkRead(
          notification.id
        );
      }


      const type = String(
        notification.referenceType ||
        notification.type ||
        ''
      ).toUpperCase();


      const referenceId =
        notification.referenceId ??
        notification.reference_id;


      if (!referenceId) {

        toast.error(
          'This notification is not linked to an approval request.'
        );

        return;
      }


      /*
       * Leave notification
       */
      if (type.includes('LEAVE')) {

        router.push(
          `/admin/leave?highlightId=${encodeURIComponent(
            referenceId
          )}`
        );

        return;
      }


      /*
       * Document / onboarding notification
       */
      if (
        type.includes('DOCUMENT') ||
        type.includes('ONBOARDING') ||
        type.includes('DOC')
      ) {

        router.push(
          `/admin/onboarding/document-requests?highlightId=${encodeURIComponent(
            referenceId
          )}`
        );

        return;
      }


      toast(
        'This notification does not have an approval destination.'
      );

    } catch (error) {

      console.error(
        'Unable to open notification:',
        error
      );

      toast.error(
        'Unable to open notification'
      );

    }

  };


  /*
   * Notification icon
   */
  const getNotifIcon = (title) => {

    if (!title) return '📢';

    const t =
      title.toLowerCase();

    if (t.includes('leave')) return '🌴';

    if (
      t.includes('payroll') ||
      t.includes('salary')
    ) {
      return '💰';
    }

    if (t.includes('performance')) {
      return '⭐';
    }

    if (t.includes('training')) {
      return '📚';
    }

    if (t.includes('attendance')) {
      return '📅';
    }

    if (t.includes('onboarding')) {
      return '📋';
    }

    if (t.includes('recruitment')) {
      return '💼';
    }

    if (t.includes('approved')) {
      return '✅';
    }

    if (t.includes('rejected')) {
      return '❌';
    }

    if (t.includes('cancelled')) {
      return '🚫';
    }

    if (t.includes('employee')) {
      return '👤';
    }

    return '🔔';

  };


  /*
   * Open delete confirmation
   */
  const openDeleteModal = (
    notification
  ) => {

    setNotificationToDelete(
      notification
    );

    setShowDeleteModal(true);

  };


  /*
   * Delete one notification
   */
  const handleDelete = async () => {

    if (!notificationToDelete) {
      return;
    }

    const id =
      notificationToDelete.id;

    setDeletingId(id);


    try {

      await deleteAdminNotification(id);


      /*
       * If deleted notification was unread,
       * update badge count.
       */
      if (!notificationToDelete.isRead) {

        setUnreadCount((prev) =>
          Math.max(0, prev - 1)
        );

      }


      /*
       * Remove notification immediately
       * from the UI.
       */
      setNotifications((prev) =>
        prev.filter(
          (n) => n.id !== id
        )
      );


      /*
       * Close popup.
       */
      setShowDeleteModal(false);

      setNotificationToDelete(null);


      toast.success(
        'Notification deleted'
      );


      window.dispatchEvent(
        new Event('notificationsUpdated')
      );


      /*
       * Reload page data so pagination
       * stays correct.
       */
      await fetchNotifications();

    } catch (error) {

      console.error(
        'Failed to delete notification:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to delete notification'
      );

    } finally {

      setDeletingId(null);

    }

  };


  /*
   * Open Clear All confirmation
   */
  const openClearAllModal = () => {

    if (
      notifications.length === 0
    ) {
      return;
    }

    setShowClearModal(true);

  };


  /*
   * Clear all notifications
   */
  const handleClearAll = async () => {

    setClearingAll(true);

    try {

      await clearAllAdminNotifications();


      setNotifications([]);

      setUnreadCount(0);

      setTotalPages(0);

      setPage(0);

      setShowClearModal(false);


      toast.success(
        'All notifications cleared'
      );


      window.dispatchEvent(
        new Event('notificationsUpdated')
      );

    } catch (error) {

      console.error(
        'Failed to clear notifications:',
        error
      );

      toast.error(
        error?.response?.data?.message ||
        'Failed to clear notifications'
      );

    } finally {

      setClearingAll(false);

    }

  };


  return (

    <div className="max-w-6xl mx-auto space-y-6 text-slate-900 dark:text-slate-100">

      {/* =====================================================
          HEADER
          ===================================================== */}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

        <div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">

            Notifications

            {unreadCount > 0 && (

              <span className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full">

                {unreadCount} unread

              </span>

            )}

          </h1>


          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">

            System alerts and activity updates

          </p>

        </div>


        {/* HEADER BUTTONS */}

        <div className="flex items-center gap-2 flex-wrap justify-end">

          {/* Mark all as read */}

          {unreadCount > 0 && (

            <button
              onClick={handleMarkAll}
              disabled={markingAll}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition cursor-pointer disabled:opacity-50"
            >

              {markingAll
                ? '⏳ Marking...'
                : '✓ Mark all as read'}

            </button>

          )}


          {/* Clear All */}

          {notifications.length > 0 && (

            <button
              onClick={openClearAllModal}
              disabled={clearingAll}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/50 hover:bg-red-100 dark:hover:bg-red-900/70 transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
            >

              <Trash2 size={15} />

              {clearingAll
                ? 'Clearing...'
                : 'Clear All'}

            </button>

          )}

        </div>

      </div>


      {/* =====================================================
          FILTER
          ===================================================== */}

      <div className="flex gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-fit">

        {['ALL', 'UNREAD'].map((f) => (

          <button
            key={f}
            onClick={() => {

              setFilter(f);

              setPage(0);

            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition ${
              filter === f
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >

            {f === 'ALL'
              ? 'All Notifications'
              : `Unread ${
                  unreadCount
                    ? `(${unreadCount})`
                    : ''
                }`}

          </button>

        ))}

      </div>


      {/* =====================================================
          NOTIFICATION CARD
          ===================================================== */}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">

        {/* Loading */}

        {loading ? (

          <div className="p-16 text-center text-sm font-medium text-slate-400 dark:text-slate-500">

            Loading notifications...

          </div>

        ) : notifications.length === 0 ? (

          /* Empty state */

          <div className="p-16 text-center space-y-3">

            <div className="text-5xl">
              🔔
            </div>


            <div className="text-base font-bold text-slate-900 dark:text-slate-100">

              {filter === 'UNREAD'
                ? 'All caught up!'
                : 'No notifications yet'}

            </div>


            <p className="text-sm text-slate-500 dark:text-slate-400">

              {filter === 'UNREAD'
                ? 'No unread notifications'
                : 'System notifications will appear here'}

            </p>


            {filter === 'UNREAD' && (

              <button
                onClick={() => {

                  setFilter('ALL');

                  setPage(0);

                }}
                className="mt-2 px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition"
              >

                View All

              </button>

            )}

          </div>

        ) : (

          <>

            {/* =================================================
                NOTIFICATION LIST
                ================================================= */}

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80">

              {notifications.map((n) => (

                <div
                  key={n.id}
                  role="button"
                  tabIndex={0}

                  onClick={() =>
                    handleNotificationClick(n)
                  }

                  onKeyDown={(e) => {

                    if (
                      e.key === 'Enter' ||
                      e.key === ' '
                    ) {

                      e.preventDefault();

                      handleNotificationClick(n);

                    }

                  }}

                  className={`flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 transition ${
                    n.isRead
                      ? 'bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50'
                      : 'bg-blue-50/40 dark:bg-slate-800/60 hover:bg-blue-50/70 dark:hover:bg-slate-800/80'
                  }`}
                >

                  {/* READ STATUS */}

                  <div className="pt-2 shrink-0">

                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        n.isRead
                          ? 'bg-slate-200 dark:bg-slate-700'
                          : 'bg-blue-600 dark:bg-blue-400'
                      }`}
                    />

                  </div>


                  {/* ICON */}

                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0 flex items-center justify-center text-xl">

                    {getNotifIcon(n.title)}

                  </div>


                  {/* CONTENT */}

                  <div className="flex-1 min-w-0">

                    <div
                      className={`text-sm sm:text-base ${
                        n.isRead
                          ? 'font-medium text-slate-800 dark:text-slate-200'
                          : 'font-bold text-slate-900 dark:text-white'
                      }`}
                    >

                      {n.title}

                    </div>


                    {n.message && (

                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">

                        {n.message}

                      </p>

                    )}


                    <span className="inline-block text-xs text-slate-400 dark:text-slate-500 mt-1.5">

                      {formatTimeAgo(
                        n.createdAt,
                        now
                      )}

                    </span>

                  </div>


                  {/* =================================================
                      ACTION BUTTONS
                      ================================================= */}

                  <div className="flex items-center gap-2 shrink-0">

                    {/* Mark Read */}

                    {!n.isRead && (

                      <button
                        onClick={(e) => {

                          e.stopPropagation();

                          handleMarkRead(n.id);

                        }}

                        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/80 transition whitespace-nowrap"
                      >

                        Mark read

                      </button>

                    )}


                    {/* Delete */}

                    <button
                      onClick={(e) => {

                        e.stopPropagation();

                        openDeleteModal(n);

                      }}

                      disabled={
                        deletingId === n.id
                      }

                      title="Delete notification"
                      aria-label="Delete notification"

                      className="w-9 h-9 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:border-red-200 dark:hover:border-red-900 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >

                      {deletingId === n.id
                        ? '⏳'
                        : <Trash2 size={16} />}

                    </button>

                  </div>

                </div>

              ))}

            </div>


            {/* =================================================
                PAGINATION
                ================================================= */}

            {totalPages > 1 && (

              <div className="p-4 flex items-center justify-center gap-3 border-t border-slate-100 dark:border-slate-800">

                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.max(0, p - 1)
                    )
                  }

                  disabled={page === 0}

                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >

                  ← Prev

                </button>


                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">

                  {page + 1} / {totalPages}

                </span>


                <button
                  onClick={() =>
                    setPage((p) =>
                      Math.min(
                        totalPages - 1,
                        p + 1
                      )
                    )
                  }

                  disabled={
                    page >= totalPages - 1
                  }

                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >

                  Next →

                </button>

              </div>

            )}

          </>

        )}

      </div>


      {/* =========================================================
          DELETE INDIVIDUAL NOTIFICATION MODAL
          ========================================================= */}

      {showDeleteModal &&
        notificationToDelete && (

          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/55 backdrop-blur-sm"

            onClick={() => {

              if (deletingId === null) {

                setShowDeleteModal(false);

                setNotificationToDelete(null);

              }

            }}
          >

            <div
              className="w-full max-w-[430px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl"

              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* Modal Header */}

              <div className="flex items-center justify-between mb-4">

                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">

                    <Trash2 size={18} />

                  </div>


                  <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">

                    Delete Notification?

                  </h2>

                </div>


                <button
                  onClick={() => {

                    setShowDeleteModal(false);

                    setNotificationToDelete(null);

                  }}

                  disabled={
                    deletingId !== null
                  }

                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                  aria-label="Close"
                >

                  <X size={18} />

                </button>

              </div>


              {/* Message */}

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">

                Are you sure you want to delete this notification?

              </p>


              {/* Notification Preview */}

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">

                <div className="text-sm font-bold text-slate-900 dark:text-white">

                  {notificationToDelete.title}

                </div>


                {notificationToDelete.message && (

                  <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">

                    {notificationToDelete.message}

                  </div>

                )}

              </div>


              {/* Buttons */}

              <div className="flex justify-end gap-2.5 mt-6">

                <button
                  onClick={() => {

                    setShowDeleteModal(false);

                    setNotificationToDelete(null);

                  }}

                  disabled={
                    deletingId !== null
                  }

                  className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
                >

                  Cancel

                </button>


                <button
                  onClick={handleDelete}

                  disabled={
                    deletingId !== null
                  }

                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition disabled:opacity-50"
                >

                  {deletingId !== null
                    ? 'Deleting...'
                    : 'Delete'}

                </button>

              </div>

            </div>

          </div>

        )}


      {/* =========================================================
          CLEAR ALL MODAL
          ========================================================= */}

      {showClearModal && (

        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/55 backdrop-blur-sm"

          onClick={() => {

            if (!clearingAll) {

              setShowClearModal(false);

            }

          }}
        >

          <div
            className="w-full max-w-[430px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-2xl"

            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* Modal Header */}

            <div className="flex items-center justify-between mb-4">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">

                  <Trash2 size={18} />

                </div>


                <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">

                  Clear All Notifications?

                </h2>

              </div>


              <button
                onClick={() =>
                  setShowClearModal(false)
                }

                disabled={clearingAll}

                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"

                aria-label="Close"
              >

                <X size={18} />

              </button>

            </div>


            {/* Message */}

            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">

              All notifications belonging to your account will be permanently deleted.

            </p>


            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-2">

              This action cannot be undone.

            </p>


            {/* Buttons */}

            <div className="flex justify-end gap-2.5 mt-6">

              <button
                onClick={() =>
                  setShowClearModal(false)
                }

                disabled={clearingAll}

                className="px-4 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >

                Cancel

              </button>


              <button
                onClick={handleClearAll}

                disabled={clearingAll}

                className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold transition disabled:opacity-50"
              >

                {clearingAll
                  ? 'Clearing...'
                  : 'Clear All'}

              </button>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}