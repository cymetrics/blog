---

title: Basic Awareness of Hacking Prevention：Backup and Restore
date: 2022-04-22
tags: [Security,Data leakage,Backup]
author: nick
layout: en/layouts/post.njk
image: /img/posts/nick/backup/backup_1.jpg

---

![](/img/posts/nick/backup/backup_1.jpg)

Suppose your house is burglarized today, as having superpower, you rewind time to yesterday, but if you didn’t make any changes, the same thing will happen again. You should take the opportunity to change the locks or hide the money somewhere else.

So the point of backup and restore is to make the time difference and get the system back up and running so that you have a chance to make corrections before the next attack comes. In that case, the hackers can't get in or you have already moved the data to a safe place. This article will explain how to do backup effectively from a hacker-proof perspective.


## Backup Methods

![](/img/posts/nick/backup/backup_2.jpg)

There are different ways to do backup. Many backup methods can help you in daily maintenance, but not much help in blocking hackers. Here are two recommended backup methods that are more effective against hacker attacks. However, no matter which method you choose, you should do your own research before backing up, if you are being too rush, it may be worse than not backing up. You need to pay attention to the backup methods for the important data before you do the backup.

### 1. Off-Site Backup

#### Introduction:

Off-site backup simply means backup in another location, such as various kinds of cloud storage (Google Drive, MEGA, etc.) or NAS (note1). If you just back up files from C drive to D drive on your computer, it is like putting eggs in the same basket, but just moving the eggs from the left side to the right side of the basket. It does not help much to prevent hackers, and the chance of being attacked by hackers is very high. More rigid off-site backups will require the backup location to be more than 30 km away from the original work area.

#### Recommendation:

* Cloud Drive
* Remote NAS

### 2. Offline Backup

#### Introduction:

Offline backup means the devices that store backup data are not normally connected to a networked device, but only when the backup data is needed, so that hackers do not have a chance to connect to those offline devices. The most commonly seen are various kinds of external hard drives used to store data. If there are only a small amount of data, it can also be put to USB flash drives or CDs. 

Be careful to disconnect from the devices after storing the data. If you always connect the backup devices to the computer, hackers can still take the data away in one second.

#### Recommendation:

* External Hard Drive
* USB Drives with Large Capacity

## What Kind of Data Should Be Backed Up?

![](/img/posts/nick/backup/backup_3.jpg)

If we look at data backup from a hacker-proof point of view, we need to understand what kind of data hackers would like to obtain first, which can be roughly divided into 4 categories.

### 1. Account and Password

The first thing hackers look for after entering the devices is whether there is information related to the account and password. With those information, hackers can further attack other systems related to the outflow of accounts, elevate the access right or use those information to try out other services in the current environment.

### 2. Personal Information

If hackers obtain your personal information, they can further do phishing or frauds, or sell it directly to advertisers. They could even guess your account and password indirectly.

### 3. Sensitive Information

All the data that you are willing to pay for after hackers have stolen is considered sensitive data, like ransomware encrypts all documents, pictures, videos, etc. and forces you to buy a key to unlock them, or to disclose them if you refuse to pay the ransom.

### 4. Restored Files and Installation of Serial Numbers
It is common that some ransomware will force you to pay for unlocking files by affecting the system operation. If you have regularly backed up Windows restored files, other systems also have their own restored methods. As long as it helps to quickly restore the system operation, it is recommended to do backup regularly.

## Conclusion

![](/img/posts/nick/backup/backup_3.jpg)

In general, a good backup and restore cannot directly block the hacker's attacks but can minimize the impact of the attacks. Since it cannot directly block the attacks, so here we provide some key points for you to pay attention to when you want to further reduce the risks, in addition to the backup itself.

* It is recommended to encrypt sensitive data in addition to backup, otherwise there will be data leakage problem even if backup is done.
* For off-site backup, it is recommended to be disconnected from the storage system.
* For offline backup, it is recommended to be disconnected from the storage devices.
* Avoid hackers from knowing your backup methods. In particular, the account and password of the off-site backup should never be stored in the computer in simple text.
* If the file to be backed up is too large or the backup frequency is too high, it will take a long time for the backup device to connect to the computer and the offline backup is likely to be useless.

We have provided some simple examples in previous sections. In fact, there’re more advanced techniques. If there’re more views in this article, we will write other articles to share advanced techniques and examples. Feel free to comment below for any cybersecurity questions or contact us through Cymetrics website.



Note 1: NAS represents Network Attached Storage, which is a private storage device that can be placed at home or in the office. It is also a personal cloud storage device.


